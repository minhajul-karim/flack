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
    let last_visited_room = localStorage.getItem("last_visited_room");
    document.querySelector("#username").innerHTML += `${name}`;

    // Connect to websocket
    var socket = io.connect(
        location.protocol + "//" + document.domain + ":" + location.port
    );

    // Join last visted room when connected
    socket.on("connect", () => {
        // Join the last room user last visited
        if (!last_visited_room) {
            last_visited_room = "general";
            localStorage.setItem("last_visited_room", last_visited_room);

            // Display general as an active room
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
                room: last_visited_room,
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
            if (new_room != last_visited_room) {
                leave_room(last_visited_room);
                join_room(new_room);
                last_visited_room = new_room;
                let current_active = document.getElementsByClassName("active");
                current_active[0].className = "room";
                event.target.className += " active";
            }
        }
    });

    // Join room
    function join_room(room) {
        socket.emit("join", { name: name, room: room });

        // Set last visited room
        last_visited_room = room;
        localStorage.setItem("last_visited_room", room);
    }

    // Generate chat history
    socket.on("chat history", (data) => {
        // Clear previous chat header and chats
        document.querySelector("#chat-header").innerHTML = "";
        document.querySelector("#message-area").innerHTML = "";

        // Display room name at the top
        const p_element = document.createElement("p");
        p_element.appendChild(document.createTextNode(`${last_visited_room}`));
        document.querySelector("#chat-header").appendChild(p_element);

        // Place an <hr> after room name
        const hr_element = document.createElement("hr");
        document.querySelector("#chat-header").appendChild(hr_element);

        // Feed data to chat history template
        const content = chat_history_template({ chats: data["chats"] });
        document.querySelector("#message-area").innerHTML += content;

        // Scroll to the bottom of corversation
        move_to_bottom();
    });

    // Move to the end of conversation
    function move_to_bottom() {
        const element = document.querySelector("#message-area");
        element.scrollTop = element.scrollHeight - element.clientHeight;
    }

    // Leave room
    function leave_room(room) {
        socket.emit("leave", { name: name, room: room });
    }

    // Notify users
    function notify(message) {
        const p_element = document.createElement("p");
        p_element.innerHTML = message;
        p_element.className = "text-muted";
        document.querySelector("#message-area").append(p_element);
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
