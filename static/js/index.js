// Template messages
let messageTemplate = Handlebars.compile(
  document.querySelector('#message-template').innerHTML
)

// Template for chat history
let chatHistoryTemplate = Handlebars.compile(
  document.querySelector('#chat-history').innerHTML
)

// Template for thumbnails
let thumbnailsTemplate = Handlebars.compile(
  document.querySelector('#thumbnail-images').innerHTML
)

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
  })

  // Send message on click
  document.querySelector('#send-icon').addEventListener('click', () => {
    if (
      document.querySelector('#message').value.length > 0 ||
      images.length > 0
    ) {
      sendMessage()
    }
  })

  // When user selects images, we read them,
  // show thumnails of selected images, & finally
  // send them to server
  let fileSelector = document.querySelector('#file-selector')
  fileSelector.addEventListener('change', (event) => {
    let files = event.target.files
    loadImages(files, showThumbnail)
  })

  /*
   * Read images as data url asynchronously
   * and callback showThumbnail()
   */
  function loadImages(files, callback) {
    let imageData = []
    if (files) {
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
  }

  /*
   * Display thumbnail of selected images
   */
  let images = [],
    messageArea = document.querySelector('#message-area'),
    messageAreaHeight = messageArea.offsetHeight
  function showThumbnail(imageArray) {
    images = imageArray
    // Generate thumbnail template
    document.querySelector('#thumbnails').innerHTML = ''
    document.querySelector('#thumbnails').style.display = 'block'

    let content = thumbnailsTemplate({
      images: images,
    })

    messageArea.style.height = messageAreaHeight - 118 + 'px'

    document.querySelector('#thumbnails').innerHTML += content
  }

  // Send message
  function sendMessage() {
    let message = document.querySelector('#message').value

    socket.send({
      name: name,
      message: message,
      images: images,
      time: getCurTime(),
      room: lastRoom,
    })
    // Clear the text and thumbnail
    document.querySelector('#message').value = ''
    document.querySelector('#thumbnails').style.display = 'none'
    messageArea.style.height = messageAreaHeight + 'px'
  }

  /*
   * Calculate current time
   */
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

  // Display received message
  socket.on('message', (data) => {
    let content = messageTemplate({
      name: data.name,
      time: data.time,
      message: data.message,
      images: data.images,
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

  /*
   * Join a room
   */
  function join_room(room) {
    socket.emit('join', { name: name, room: room })
    lastRoom = room
    localStorage.setItem('lastRoom', room)
  }

  // Display past discussions
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

  /*
   * Move to the bottom of the conversation
   */
  function goDown() {
    let element = document.querySelector('#message-area')
    element.scrollTop = element.scrollHeight - element.clientHeight
  }

  /*
   * Leave a room
   */
  function leave_room(room) {
    socket.emit('leave', { name: name, room: room })
  }

  // Create new room
  document
    .querySelector('#new-room-form')
    .addEventListener('submit', (event) => {
      event.preventDefault()
      // Initialize a new request
      let request = new XMLHttpRequest()
      let roomName = document.querySelector('#room-name').value
      let errorElement = document.querySelector('.error-message')
      // Show error for empty room name
      if (roomName.length === 0) {
        errorElement.innerHTML = 'Invalid input!'
        errorElement.style.display = 'block'
        return
      }

      request.open('POST', '/create_room')

      // Callback function when the request is complete
      request.onload = () => {
        // Extract data received from server
        let data = JSON.parse(request.responseText)

        if (request.status >= 200 && request.status < 300) {
          if (data.status === true) {
            socket.emit('new room', {
              newRoom: roomName,
            })

            // Join new room
            join_room(roomName)

            // Click the cross
            document.querySelector('.close').click()
          } else {
            errorElement.innerHTML = 'Channel already exists!'
            errorElement.style.display = 'block'
          }
        } else {
          Error('Can not connect.')
        }
      }

      // Send data with the request
      let data = new FormData()
      data.append('newRoom', roomName)
      request.send(data)
    })

  // Remove error message while editing room name
  let roomName = document.querySelector('#room-name')
  roomName.addEventListener('keyup', (event) => {
    if (event.keyCode != 13) {
      document.querySelector('.error-message').style.display = 'none'
    }
  })

  // Add new rooom to channels list
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

  /*
   * Remove active status of a room on room change
   */
  function deactivate() {
    let current_active = document.getElementsByClassName('active')
    current_active[0].className = 'room'
  }

  // Download images via download.js
  // download function takes 2 params, dataUrl and a name
  document.querySelector('#message-area').onclick = (event) => {
    if (event.target.nodeName === 'IMG') {
      download(event.target.src, event.target.dataset.fileName)
    }
  }
})
