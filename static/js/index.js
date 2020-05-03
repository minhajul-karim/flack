// Create a template
const template = Handlebars.compile(
    document.querySelector("#address-template").innerHTML
);

document.addEventListener("DOMContentLoaded", () => {
    // Display the user name
    const name = localStorage.getItem("name");
    document.querySelector("#greeting").innerHTML = `Welcome ${name}`;

    // Connect to websocket
    var socket = io.connect(
        location.protocol + "//" + document.domain + ":" + location.port
    );

    let room;

    // Send messages when connected
    socket.on("connect", () => {
        room = "general";
        joinRoom(room);

        // Send button emits a 'send message' event
        document.querySelector("#send-button").onclick = () => {
            const message = document.querySelector("#message").value;

            // Get the current UTC time
            const current_date = new Date();
            const current_time = current_date.toUTCString();
            const time =
                current_time.slice(0, 3) + " " + current_time.slice(-12);

            // Send
            socket.send({
                name: name,
                message: message,
                time: time,
                room: room,
            });
            document.querySelector("#message").value = "";
        };
    });

    // When a message has been sent, display it
    socket.on("message", (data) => {
        const content = template({
            name: data.name,
            message: data.message,
            time: data.time,
        });
        document.querySelector("#chat-messages").innerHTML += content;
    });

    // Room selection
    document.querySelector("#rooms-list").addEventListener("click", (event) => {
        // Join room based on user click
        if (event.target && event.target.nodeName == "LI") {
            let newRoom = event.target.innerHTML;
            if (newRoom == room) {
                msg = `You are already in ${room}`;
                printSysMsg(msg);
            } else {
                leaveRoom(room);
                joinRoom(newRoom);
                room = newRoom;
            }
        }
    });

    // Leave room
    function leaveRoom(room) {
        socket.emit("leave", { name: name, room: room });
    }

    // Join room
    function joinRoom(room) {
        socket.emit("join", { name: name, room: room });

        // Clear previous chats
        document.querySelector("#chat-messages").innerHTML = "";

        // Display room name at the top
        let h4 = document.createElement("h4");
        h4.appendChild(document.createTextNode(`${room}`));
        document.querySelector("#chat-messages").appendChild(h4);
    }

    // Print system messages
    function printSysMsg(message) {
        const p = document.createElement("p");
        p.innerHTML = message;
        document.querySelector("#chat-messages").append(p);
    }

    // Enable enter key to send messages
    const messageField = document.querySelector("#message");
    messageField.addEventListener("keyup", (event) => {
        event.preventDefault();
        if (event.keyCode == 13) {
            document.querySelector("#send-button").click();
        }
    });

    // Create new room
    document.querySelector("#new-room-form").onsubmit = () => {
        // Initialize a new request
        const request = new XMLHttpRequest();
        const roomName = document.querySelector("#room-name").value;
        request.open("POST", "/create_room");

        // Callback function when the request is complete
        request.onload = () => {
            // Extract data received from server
            const data = JSON.parse(request.responseText);

            if (data.status == true) {
                // Create a new li element
                const li = document.createElement("li");

                // Add room name inside li
                li.appendChild(document.createTextNode(roomName));

                // Add class to li
                li.classList.add("rooms");

                // Append li to the ul
                document.querySelector("#rooms-list").append(li);

                // Click the close button
                document.querySelector("#close-button").click();
            } else {
                document.querySelector("#room-error").style.display = "block";
            }
        };

        // Send data with the request
        const data = new FormData();
        data.append("room_name", roomName);
        request.send(data);
        return false;
    };

    // Clear the room name input field and any error messages while creating new rooms
    $("#create-room-form").on("show.bs.modal", function (event) {
        document.querySelector("#room-error").style.display = "none";
        document.querySelector("#room-name").value = "";
    });
});
