// Template messages
let messageTemplate = Handlebars.compile(
  document.querySelector("#message-template").innerHTML
);

// Template for chat history
let chatHistoryTemplate = Handlebars.compile(
  document.querySelector("#chat-history").innerHTML
);

// Template for thumbnails
let thumbnailsTemplate = Handlebars.compile(
  document.querySelector("#thumbnail-images").innerHTML
);

// Function to toggle sidebar on smaller screen sizes
const sidebar = document.getElementById("left-side");
let shouldDisplaySidebar = false;
function toggleSidebar() {
  shouldDisplaySidebar = !shouldDisplaySidebar;
  if (shouldDisplaySidebar) {
    sidebar.classList.add('show-sidebar')
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Display the user name
  let name = localStorage.getItem("name"),
    lastRoom = localStorage.getItem("lastRoom");
  document.querySelector("#loggedin-user").textContent += `${name}`;

  // Connect to websocket
  const socket = io.connect(
    location.protocol + "//" + document.domain + ":" + location.port
  );

  // Join last visted room when connected
  socket.on("connect", () => {
    // Join the last room user last visited
    if (!lastRoom) {
      lastRoom = "general";
      localStorage.setItem("lastRoom", lastRoom);

      // Display general as an active room
      document.getElementsByClassName("room")[0].className += " active";
    } else {
      // Make the last visited room active
      let rooms = document.getElementsByClassName("room");
      for (room of rooms) {
        if (room.textContent === lastRoom) {
          room.className += " active";
          break;
        }
      }
    }
    join_room(lastRoom);
  });

  // When user selects images, we read them,
  // show thumnails of selected images, & finally
  // send them to server
  let fileSelector = document.querySelector("#file-selector");
  fileSelector.addEventListener("change", (event) => {
    let files = event.target.files;
    loadImages(files, showThumbnail);
  });

  /*
   * Read images as data url asynchronously
   * and callback showThumbnail()
   */
  function loadImages(files, callback) {
    let imageData = [];
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
        reader.addEventListener("load", (event) => {
          imageData.push({
            fileName: files[i].name,
            dataUrl: event.target.result,
          });
          if (i == files.length - 1) callback(imageData);
        });
        reader.readAsDataURL(files[i]);
      }
    }
  }

  /*
   * Display thumbnail of selected images
   */
  const messageArea = document.querySelector("#message-area");
  let messageAreaHeight = messageArea.offsetHeight,
    images = [];
  function showThumbnail(imageArray) {
    images = imageArray;
    const thumbnail = document.querySelector("#thumbnails");

    // Remove previous thumbnails
    while (thumbnail.firstChild) {
      thumbnail.removeChild(thumbnail.firstChild);
    }
    document.querySelector("#thumbnails").style.display = "block";

    // Generate thumbnail template
    const content = thumbnailsTemplate({
      images: images,
    });

    // Increase the hieght of message area to accomodate thumbanail
    messageArea.style.height = messageAreaHeight - 118 + "px";
    document
      .querySelector("#thumbnails")
      .insertAdjacentHTML("beforeend", content);
  }

  // Send messages on pressing Enter key
  const textArea = document.querySelector("#message");
  textArea.addEventListener("keyup", (event) => {
    event.preventDefault();

    // When ENTER key pressed without shift key
    if (event.keyCode === 13 && !event.shiftKey) {
      sendMessage();
    }
  });

  // Send message on click
  document.getElementById("send-icon").addEventListener("click", () => {
    if (
      document.querySelector("#message").value.length > 0 ||
      images.length > 0
    ) {
      sendMessage();
    }
  });

  // Display received message
  socket.on("message", (data) => {
    const content = messageTemplate({
      name: data.name,
      time: data.time,
      message: data.message,
      images: data.images,
    });
    messageArea.insertAdjacentHTML("beforeend", content);
    goDown();
  });

  // Create new room
  document
    .querySelector("#new-room-form")
    .addEventListener("submit", (event) => {
      event.preventDefault();
      // Initialize a new request
      const request = new XMLHttpRequest(),
        errorElement = document.querySelector(".modal-body .error-message");
      let roomName = document.querySelector("#room-name").value;
      // Show error for empty room name
      if (roomName.length === 0) {
        // Remove previous error message, if any
        const errorMsg = document.querySelector(".error");
        if (errorMsg) {
          errorMsg.parentNode.removeChild(errorMsg);
        }
        const pElement = document.createElement("p");
        pElement.textContent = "Invalid input!";
        pElement.classList.add("error");
        document.querySelector(".error-div").appendChild(pElement);
        return;
      }

      request.open("POST", "/create_room");

      // Callback function when the request is complete
      request.onload = () => {
        // Extract data received from server
        let data = JSON.parse(request.responseText);

        if (request.status >= 200 && request.status < 300) {
          if (data.status === true) {
            socket.emit("new room", {
              newRoom: roomName,
            });

            // Join new room
            join_room(roomName);

            // Click the cross
            document.querySelector(".close").click();
          } else {
            const errorMsg = document.querySelector(".error");
            if (errorMsg) {
              errorMsg.parentNode.removeChild(errorMsg);
            }
            const pElement = document.createElement("p");
            pElement.textContent = "Channel already exists!";
            pElement.classList.add("error");
            document.querySelector(".error-div").appendChild(pElement);
          }
        } else {
          Error("Can not connect.");
        }
      };

      // Send data with the request
      let data = new FormData();
      data.append("newRoom", roomName);
      request.send(data);
    });

  // Remove error message while editing room name
  const roomName = document.querySelector("#room-name");
  roomName.addEventListener("keyup", (event) => {
    if (event.keyCode != 13) {
      const errorMsg = document.querySelector(".error");
      if (errorMsg) {
        errorMsg.style.animationPlayState = "running";
        errorMsg.addEventListener("animationend", () => {
          errorMsg.remove();
        });
      }
    }
  });

  // Click on a room name to join
  document.querySelector("#rooms-list").addEventListener("click", (event) => {
    // Event delegation
    if (event.target && event.target.nodeName === "LI") {
      let newRoom = event.target.textContent;
      if (newRoom != lastRoom) {
        leave_room(lastRoom);
        join_room(newRoom);

        // Remove previous active class
        deactivate();

        // Make current LI active
        event.target.className += " active";
      }
    }
  });

  // Display past discussions
  socket.on("chat history", (data) => {
    // Clear previous chat header and chats
    const chatHeader = document.querySelector("#chat-header");

    // Clear chat header
    while (chatHeader.firstChild) {
      chatHeader.removeChild(chatHeader.firstChild);
    }

    // Clear message area
    while (messageArea.firstChild) {
      messageArea.removeChild(messageArea.firstChild);
    }

    // Display room name at the top
    chatHeader.innerHTML = `
      <div class="toggle-container d-flex">
        <button id="toggle-btn" onclick="toggleSidebar()">&#9776;</button>
        <p>${lastRoom}</p>
      </div>
    `;

    // Place an <hr> after room name
    const hrElement = document.createElement("hr");
    document.querySelector("#chat-header").appendChild(hrElement);

    // Feed data to chat history template
    let content = chatHistoryTemplate({ chats: data["chats"] });
    messageArea.insertAdjacentHTML("beforeend", content);

    // Scroll to the bottom of corversation
    goDown();
  });

  // Add new rooom to channels list
  socket.on("display new room", (data) => {
    let newRoom = data.room;
    let li = document.createElement("li");
    li.appendChild(document.createTextNode(newRoom));
    li.className = "room";
    document.querySelector("#rooms-list").append(li);

    // Remove previous active class
    if (newRoom === localStorage.getItem("lastRoom")) {
      deactivate();
      li.className += " active";
    }
  });

  // Logout
  document.querySelector("#logout").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "/sign_in";
  });

  // Download images via download.js
  // download function takes 2 params, dataUrl and a name
  document.querySelector("#message-area").onclick = (event) => {
    if (event.target.nodeName === "IMG") {
      download(event.target.src, event.target.dataset.fileName);
    }
  };

  // Send message
  function sendMessage() {
    let message = document.querySelector("#message").value;

    socket.send({
      name: name,
      message: message,
      images: images,
      time: getCurTime(),
      room: lastRoom,
    });

    // Clear textarea, thumbnail, images[]
    document.querySelector("#message").value = "";
    document.querySelector("#thumbnails").style.display = "none";
    messageArea.style.height = messageAreaHeight + "px";
    images = [];
  }

  /*
   * Join a room
   */
  function join_room(room) {
    socket.emit("join", { name: name, room: room });
    lastRoom = room;
    localStorage.setItem("lastRoom", room);
  }

  /*
   * Leave a room
   */
  function leave_room(room) {
    socket.emit("leave", { name: name, room: room });
  }

  /*
   * Calculate current time
   */
  function getCurTime() {
    let curDate = new Date();
    let utcTime = curDate.toUTCString();
    let time =
      utcTime.slice(0, 4) +
      " " +
      utcTime.slice(17, 22) +
      " " +
      utcTime.slice(-3);
    return time;
  }

  /*
   * Move to the bottom of the conversation
   */
  function goDown() {
    let element = document.querySelector("#message-area");
    element.scrollTop = element.scrollHeight - element.clientHeight;
  }

  /*
   * Remove active status of a room on room change
   */
  function deactivate() {
    let current_active = document.getElementsByClassName("active");
    current_active[0].className = "room";
  }

  // Toggle sidebar
  document.body.addEventListener("click", (e) => {
    const id = e.target.id;
    // TODO: CHECK FOR OTHER IDS
    if (
      id === "message-area" ||
      id === "right-side" ||
      id === "chat-header" ||
      e.target.classList.contains("toggle-container") ||
      e.target.classList.contains("chat-right") ||
      e.target.nodeName === 'HR' ||
      e.target.nodeName === 'TEXTAREA' ||
      e.target.nodeName === 'P'
    ) {
      if (shouldDisplaySidebar) {
        sidebar.classList.remove('show-sidebar')
        shouldDisplaySidebar = false;
      }
    }
  });

  // Remove show-sidebar class in screen sizes larger than 599px
  const mediaQuery = window.matchMedia('(min-width: 600px)')
  mediaQuery.addListener(e => {
    if (e.matches) {
      sidebar.classList.remove('show-sidebar')
      shouldDisplaySidebar = false;
    }
  })
});
