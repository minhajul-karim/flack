document.addEventListener('DOMContentLoaded', () => {
  const name = document.querySelector('#name')
  // When sign in form is submitted, check input validaiton
  // and display error message
  document.querySelector('#signup-form').addEventListener('submit', (event) => {
    event.preventDefault()
    // Display error message for empty username
    if (name.value.length === 0) {
      const pElement = document.createElement('p')
      pElement.textContent = 'Invalid input!'
      pElement.classList.add('error')
      document.querySelector('.error-div').appendChild(pElement)
      return
    }
    // Save username & redirect users to home page
    localStorage.setItem('name', name.value)
    window.location.href = '/'
  })

  // Remove error message
  name.addEventListener('keyup', (event) => {
    if (event.keyCode != 13) {
      const errorMsg = document.querySelector('.error')
      if (errorMsg) {
        errorMsg.style.animationPlayState = 'running'
        errorMsg.addEventListener('animationend', () => {
          errorMsg.remove()
        })
      }
    }
  })
})
