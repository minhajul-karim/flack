// Template for an individual message
let messageTemplate = Handlebars.compile(
  document.querySelector('#message-template').innerHTML
)

// Template for chat history of a room
let chatHistoryTemplate = Handlebars.compile(
  document.querySelector('#chat-history').innerHTML
)

// When the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Display the user name
  let name = localStorage.getItem('name')
  let lastRoom = localStorage.getItem('lastRoom')
  document.querySelector('#username').innerHTML += `${name}`

  // Connect to websocket
  let socket = io.connect(
    location.protocol + '//' + document.domain + ':' + location.port
  )

  // Join last visted room when connected
  socket.on('connect', () => {
    // Join the last room user last visited
    if (!lastRoom) {
      lastRoom = 'general'
      localStorage.setItem('lastRoom', lastRoom)

      // Display general as an active room
      document.getElementsByClassName('room')[0].className += ' active'
    } else {
      // Make the last visited room active
      let rooms = document.getElementsByClassName('room')
      for (let i = 0; i < rooms.length; i++) {
        if (rooms[i].innerHTML === lastRoom) {
          rooms[i].className += ' active'
          break
        }
      }
    }
    join_room(lastRoom)
  })

  // Send messages on pressing Enter key
  let textArea = document.querySelector('#message')
  textArea.addEventListener('keyup', (event) => {
    event.preventDefault()

    // When ENTER key pressed without shift key
    if (event.keyCode === 13 && !event.shiftKey) {
      sendMessage()
    }
    // Display multi-line message instruction
    let textLen = document.querySelector('#message').value.length
    if (textLen > 0) {
      document.querySelector('#newline-instruction').style.display = 'block'
    } else {
      document.querySelector('#newline-instruction').style.display = 'none'
    }
  })

  // Send message on click
  document.querySelector('#send-icon').addEventListener('click', () => {
    if (document.querySelector('#message').value.length > 0) {
      sendMessage()
    }
  })

  // Emit message to server
  function sendMessage() {
    let message = document.querySelector('#message').value
    let time = getCurTime()

    socket.send({
      name: name,
      message: message,
      time: time,
      room: lastRoom,
    })
    // Clear the text area
    document.querySelector('#message').value = ''
  }

  // Calculate current time
  function getCurTime() {
    let curDate = new Date()
    let utcTime = curDate.toUTCString()
    let time =
      utcTime.slice(0, 4) +
      ' ' +
      utcTime.slice(17, 22) +
      ' ' +
      utcTime.slice(-3)
    return time
  }

  // Display message
  socket.on('message', (data) => {
    let content = messageTemplate({
      name: data.name,
      message: data.message,
      time: data.time,
    })
    document.querySelector('#message-area').innerHTML += content
    goDown()
  })

  // Click on a room name to join
  document.querySelector('#rooms-list').addEventListener('click', (event) => {
    // Event delegation
    if (event.target && event.target.nodeName === 'LI') {
      let newRoom = event.target.innerHTML
      if (newRoom != lastRoom) {
        leave_room(lastRoom)
        join_room(newRoom)
        lastRoom = newRoom // Redundant? As join_room() updates lastRoom

        // Remove previous active class
        deactivate()

        // Make current LI active
        event.target.className += ' active'
      }
    }
  })

  // Join room
  function join_room(room) {
    socket.emit('join', { name: name, room: room })

    // Set last visited room
    lastRoom = room
    localStorage.setItem('lastRoom', room)
  }

  // Generate chat history
  socket.on('chat history', (data) => {
    // Clear previous chat header and chats
    document.querySelector('#chat-header').innerHTML = ''
    document.querySelector('#message-area').innerHTML = ''

    // Display room name at the top
    let p = document.createElement('p')
    p.appendChild(document.createTextNode(`${lastRoom}`)) // Use textContent?
    document.querySelector('#chat-header').appendChild(p)

    // Place an <hr> after room name
    let hr = document.createElement('hr')
    document.querySelector('#chat-header').appendChild(hr)

    // Feed data to chat history template
    let content = chatHistoryTemplate({ chats: data['chats'] })
    document.querySelector('#message-area').innerHTML += content

    // Scroll to the bottom of corversation
    goDown()
  })

  // Move to the end of conversation
  function goDown() {
    let element = document.querySelector('#message-area')
    element.scrollTop = element.scrollHeight - element.clientHeight
  }

  // Leave room
  function leave_room(room) {
    socket.emit('leave', { name: name, room: room })
  }

  // Create new room
  document.querySelector('#new-room-form').onsubmit = () => {
    // Initialize a new request
    let request = new XMLHttpRequest()
    let newRoom = document.querySelector('#room-name').value
    request.open('POST', '/create_room')

    // Callback function when the request is complete
    request.onload = () => {
      // Extract data received from server
      let data = JSON.parse(request.responseText)

      if (request.status >= 200 && request.status < 300) {
        if (data.status === true) {
          socket.emit('new room', {
            newRoom: newRoom,
          })

          // Join new room
          join_room(newRoom)

          // Click the close button
          document.querySelector('#close-button').click()
        } else {
          document.querySelector('#room-error').style.display = 'block'
        }
      } else {
        console.log(Error('Can not connect.'))
      }
    }

    // Send data with the request
    let data = new FormData()
    data.append('newRoom', newRoom)
    request.send(data)
    return false
  }

  // Add new rooom to DOM
  socket.on('display new room', (data) => {
    let newRoom = data.room
    let li = document.createElement('li')
    li.appendChild(document.createTextNode(newRoom))
    li.className = 'room'
    document.querySelector('#rooms-list').append(li)

    // Remove previous active class
    if (newRoom === localStorage.getItem('lastRoom')) {
      deactivate()
      li.className += ' active'
    }
  })

  // Logout
  document.querySelector('#logout').addEventListener('click', () => {
    localStorage.clear()
    window.location.href = '/sign_in'
  })

  // Remove active status of a room on room change
  function deactivate() {
    let current_active = document.getElementsByClassName('active')
    current_active[0].className = 'room'
  }

  // Load dataURLs of img files & emit those
  let fileSelector = document.querySelector('#file-selector')
  fileSelector.addEventListener('change', (event) => {
    let files = event.target.files,
      imageData = []
    loadImages(files, imageData, sendImages)
  })

  function loadImages(files, imageData, callback) {
    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader()
      reader.addEventListener('load', (event) => {
        imageData.push({
          fileName: files[i].name,
          dataUrl: event.target.result,
        })
        if (i == files.length - 1) callback(imageData)
      })
      reader.readAsDataURL(files[i])
    }
  }

  function sendImages(imageData) {
    socket.emit('file_attachment', {
      name: name,
      time: getCurTime(),
      imageData: imageData,
      room: lastRoom,
    })
  }

  // Display images
  socket.on('Display image', (data) => {
    let imageData = data.image_data
    let content = messageTemplate({
      name: data.name,
      time: data.time,
      imageData: imageData,
    })
    document.querySelector('#message-area').innerHTML += content
    goDown()
  })

  // download has been used to download images form dataUrl.
  // It takes 2 params, dataUrl and a name
  document.querySelector('#message-area').onclick = (event) => {
    if (event.target.nodeName === 'IMG') {
      download(event.target.src, event.target.dataset.fileName)
    }
  }

  // Notify users
  function notify(message) {
    let p = document.createElement('p')
    p.innerHTML = message
    p.className = 'text-muted'
    document.querySelector('#message-area').append(p)
  }
})
