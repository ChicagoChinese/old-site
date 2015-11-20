_.templateSettings = {
  interpolate: /\{\{(.+?)\}\}/g
};

$(function() {
//=============================================================================

var root = '/_sources/administrative/'
var templates = {}

populateDateSelect()
formatForm()

$('select[name=template]').on('change', (evt) => {
  updateScreenForTemplate(evt.target.value)
});

function populateDateSelect() {
  var select = $('select[name=date]')

  for (var i=0; i < 7; i++) {
    var label = ''
    if (i === 0) {
      label = 'Today'
    } else if (i === 1) {
      label = 'Yesterday'
    } else {
      label = `${i} days ago`
    }

    var date = moment().subtract(i, 'days')
    var value = date.format('dddd, MMMM Do')
    select.append(`<option value='${value}'>${label}</option>`)
  }
}

function formatForm() {
  var form = $('div.form')
  form.children().each((index, elem) => {
    var name = elem.name
    var div = $(`<div data-name='${name}'></div>`)
    div.append(`<span>${name}: </span>`)
    div.append(elem)

    var eventName = (elem.tagName.toLowerCase() === 'input') ? 'input' : 'change'
    $(elem).on(eventName, (evt) => {
      updateCannedResponse(getCurrentTemplate())
    })

    form.append(div)
  })
  form.show()
  updateScreenForTemplate(getCurrentTemplate())
}

function showFormElements(...names) {
  $('div.form').children().each((index, elem) => {
    var name = elem.dataset.name
    if (names.indexOf(elem.dataset.name) !== -1) {
      $(elem).show()
    } else {
      $(elem).hide()
    }
  })
}

function updateScreenForTemplate(template) {
  switch (template) {
    case 'no-show-waitlist':
      showFormElements('name', 'date', 'no_show_count', 'organizer_name')
      break;
    case 'bump-to-waitlist':
      showFormElements('name', 'date', 'event', 'organizer_name')
      break;
    default:
      showFormElements()
      break;
  }
  updateCannedResponse(template)
}

function updateCannedResponse(template) {
  if (template === '') {
    $('.canned-response').text('')
    return
  }
  if (template in templates) {
    applyTemplate(templates[template])
    return
  }

  // Template needs to be fetched first.
  $.get(root + template + '.txt', (data) => {
    var templateText = data.split(/={3,}/)[1].trim()
    templates[template] = templateText
    applyTemplate(templateText)
  })
}

function applyTemplate(templateText) {
  var text = _.template(templateText)(getFormValues())
  var html = text.replace('\n', '<br>', 'g')
  $('.canned-response').html(html)
}

function getCurrentTemplate() {
  return $('select[name=template]').val()
}

function getFormValues() {
  var result = {}
  var form = $('div.form')
  form.children().each((index, elem) => {
    var name = elem.dataset.name
    result[name] = form.find('*[name=' + name + ']').val()
  })
  return result
}

//=============================================================================
});
