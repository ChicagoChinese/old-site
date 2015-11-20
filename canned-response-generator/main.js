_.templateSettings = {
  interpolate: /\{\{(.+?)\}\}/g
};

$(function() {
//=============================================================================

var root = '/_sources/administrative/'
var templates = [
  {
    name: 'No-Show for Event with Waitlist',
    file: 'no-show-waitlist',
    fields: ['name', 'date', 'no_show_count', 'organizer_name']
  },
  {
    name: 'Bumped to Waitlist because of No-Show',
    file: 'bump-to-waitlist',
    fields: ['name', 'date', 'event', 'organizer_name']
  }
]

var templateCache = {}

populateTemplateSelect()
populateDateSelect()
formatForm()

$('select[name=template]').on('change', (evt) => {
  var template = getCurrentTemplate()
  updateScreenForTemplate(template)
});

function populateTemplateSelect() {
  var select = $('select[name=template]')

  for (var i=0; i < templates.length; i++) {
    var item = templates[i]
    select.append(`<option value=${i}>${item.name}</option>`)
  }
}

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

function showFormElements(template) {
  var fields = template ? template.fields : []
  $('div.form').children().each((index, elem) => {
    var name = elem.dataset.name
    if (fields.indexOf(elem.dataset.name) !== -1) {
      $(elem).show()
    } else {
      $(elem).hide()
    }
  })
}

function updateScreenForTemplate(template) {
  showFormElements(template)
  updateCannedResponse(template)
}

function updateCannedResponse(template) {
  if (!template) {
    $('.canned-response').text('')
    return
  }
  if (template.file in templateCache) {
    applyTemplate(templateCache[template.file])
    return
  }

  // Template needs to be fetched first.
  $.get(root + template.file + '.txt', (data) => {
    var templateText = data.split(/={3,}/)[1].trim()
    templateCache[template.file] = templateText
    applyTemplate(templateText)
  })
}

function applyTemplate(templateText) {
  var text = _.template(templateText)(getFormValues())
  var html = text.replace('\n', '<br>', 'g')
  $('.canned-response').html(html)
}

function getCurrentTemplate() {
  var val = $('select[name=template]').val()
  return val ? templates[val] : null
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
