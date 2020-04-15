const deadlineURL = "https://api2.hackclub.com/v0/Draw%20in%20the%20dark/Deadline"
var deadline, previewURL, previewTitle, tippyInstance

function updateDeadline() {
  fetch(deadlineURL, { mode: 'cors' })
   .then(response => {
     return response.json()
    })
   .then(data => {
     if (data.length == 0) {
       return
     }
    const df = data.filter(a => a.fields['Active'] == 1).sort((a, b) => Date.parse(b.fields.Time) - Date.parse(a.fields.Time))[0].fields

    deadline = Date.parse(df.Time)

    if (previewURL != df['Preview'] || previewTitle != df['Art title']) {
      previewURL = df['Preview']
      previewTitle = df['Art title']
      document.querySelector('#previewDiv').innerHTML = ''
      const a = document.createElement('a')
      a.target = '_blank'
      a.innerText = '🔗 ' + previewTitle + ' (hover for preview)'
      a.href = previewURL
      a.id = 'previewLink'

      if (tippyInstance) {
        tippyInstance.destroy()
      }
      tippyInstance = genTooltip('previewDiv', previewURL, 'Open in a new tab')[0]
      document.querySelector('#previewDiv').appendChild(a)
    }
  })
}
updateDeadline()
setInterval(updateDeadline, 2000)

setInterval(() => {
  if (!deadline) {
    document.querySelector('#timerCount').textContent = '⏳'
    return
  }

  const timeUntilDeadline = deadline - Date.now()
  if (timeUntilDeadline > 0) {
    document.querySelector('#timerCount').textContent = timeUntilDeadline / 1000 + 'seconds'
  } else {
    document.querySelector('#timerCount').textContent = 'Time is done'
  }
}, 1000)