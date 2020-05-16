// Template for an individual message
const message_template = Handlebars.compile(
    document.querySelector("#message-template").innerHTML
);

// Template for chat history of a room
const chat_history_template = Handlebars.compile(
    document.querySelector("#chat-history").innerHTML
);

// When the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    // Display the user name
    const name = localStorage.getItem("name");
    document.querySelector("#username").innerHTML += `${name}`;

    // Connect to websocket
    var socket = io.connect(
        location.protocol + "//" + document.domain + ":" + location.port
    );

    let current_room;

    // Join last visted room when connected
    socket.on("connect", () => {
        // Join the last room user last used
        let last_visited_room = localStorage.getItem("last_visited_room");
        if (!last_visited_room) {
            localStorage.setItem("last_visited_room", "general");
            last_visited_room = "general";
            // Make general active room
            document.getElementsByClassName("room")[0].className += " active";
        } else {
            // Make the last visited room active
            let all_rooms = document.getElementsByClassName("room");
            for (let i = 0; i < all_rooms.length; i++) {
                if (all_rooms[i].innerHTML == last_visited_room) {
                    all_rooms[i].className += " active";
                    break;
                }
            }
        }
        join_room(last_visited_room);
    });

    // Enable enter key to send messages
    const message_field = document.querySelector("#message");
    message_field.addEventListener("keyup", (event) => {
        event.preventDefault();
        if (event.keyCode == 13) {
            // document.querySelector("#send-button").click();
            const message = document.querySelector("#message").value;

            // Get the current UTC time
            const current_date = new Date();
            const current_time = current_date.toUTCString();
            const time =
                current_time.slice(0, 3) + " " + current_time.slice(-12);

            socket.send({
                name: name,
                message: message,
                time: time,
                room: current_room,
            });

            // Clear the messsage field
            document.querySelector("#message").value = "";
        }
    });

    // Display message
    socket.on("message", (data) => {
        const content = message_template({
            name: data.name,
            message: data.message,
            time: data.time,
        });
        document.querySelector("#message-area").innerHTML += content;
        move_to_bottom();
    });

    // Click on a room name to join
    document.querySelector("#rooms-list").addEventListener("click", (event) => {
        // Event delegation
        if (event.target && event.target.nodeName == "LI") {
            let new_room = event.target.innerHTML;
            if (new_room == current_room) {
                notify(`You are already in ${current_room}.`);
            } else {
                leave_room(current_room);
                join_room(new_room);
                current_room = new_room;
                let current_active = document.getElementsByClassName("active");
                current_active[0].className = current_active[0].className.replace(
                    "active",
                    ""
                );
                event.target.className += "active";
            }
        }
    });

    // Generate template for chat history
    function chat_history_promise() {
        return new Promise((resolve, reject) => {
            socket.on("chat history", (data) => {
                if (data) {
                    console.log("In chat history promise...");
                    const content = chat_history_template({
                        chats: data["chats"],
                    });
                    document.querySelector(
                        "#message-area"
                    ).innerHTML += content;
                    resolve();
                } else {
                    reject("Error: The promsie has been rejected.");
                }
            });
        });
    }

    // Move to the end of conversation
    function move_to_bottom() {
        const element = document.querySelector("#message-area");
        element.scrollTop = element.scrollHeight - element.clientHeight;
    }

    // Load chat history
    // async function load_chat_history() {
    //     await chat_history_promise();
    //     move_to_bottom();
    // }

    // Join room
    function join_room(room) {
        socket.emit("join", { name: name, room: room });

        // Clear previous chat header and chats
        document.querySelector("#chat-header").innerHTML = "";
        document.querySelector("#message-area").innerHTML = "";

        // Display room name at the top
        const p_element = document.createElement("p");
        p_element.appendChild(document.createTextNode(`${room}`));
        document.querySelector("#chat-header").appendChild(p_element);
        const hr_element = document.createElement("hr");
        document.querySelector("#chat-header").appendChild(hr_element);

        // Set current room
        current_room = room;
        localStorage.setItem("last_visited_room", room);

        // Load chat history
        // load_chat_history();
        chat_history_promise().then(move_to_bottom);
        notify("You have joined here.");
    }

    // Leave room
    function leave_room(room) {
        socket.emit("leave", { name: name, room: room });
    }

    // Notify users
    function notify(message) {
        const p = document.createElement("p");
        p.innerHTML = message;
        document.querySelector("#message-area").append(p);
    }

    // Create new room
    document.querySelector("#new-room-form").onsubmit = () => {
        // Initialize a new request
        const request = new XMLHttpRequest();
        const new_room = document.querySelector("#room-name").value;
        request.open("POST", "/create_room");

        // Callback function when the request is complete
        request.onload = () => {
            // Extract data received from server
            const data = JSON.parse(request.responseText);

            if (request.status >= 200 && request.status < 300) {
                if (data.status == true) {
                    socket.emit("new room", {
                        new_room: new_room,
                        current_room: current_room, /// Is this necessay?
                    });

                    // Click the close button
                    document.querySelector("#close-button").click();
                } else {
                    document.querySelector("#room-error").style.display =
                        "block";
                }
            } else {
                console.log(Error("Can not connect."));
            }
        };

        // Send data with the request
        const data = new FormData();
        data.append("new_room", new_room);
        request.send(data);
        return false;
    };

    // Add new rooom to DOM
    socket.on("display new room", (data) => {
        const li = document.createElement("li");
        li.appendChild(document.createTextNode(data.new_room));
        document.querySelector("#rooms-list").append(li);
    });

    // Logout
    document.querySelector("#logout").addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "/sign_in";
    });
});
