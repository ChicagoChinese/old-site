_.templateSettings = {
  interpolate: /\{\{(.+?)\}\}/g
};

$(function() {
//=============================================================================

const BASE_URL = '/_sources/administrative/'

const TEMPLATES = [
  {
    name: 'No-Show for Event with Waitlist',
    file: 'no-show-waitlist',
    fields: ['name', 'date', 'no_show_count', 'organizer_name']
  },
  {
    name: 'Bumped to Waitlist because of No-Show',
    file: 'bump-to-waitlist',
    fields: ['name', 'date', 'event', 'organizer_name']
  },
]

function getDefaultFormValues() {
  return {
    name: '',
    date: DateSelect.getDefaultValue(),
    no_show_count: '1',
    event: '',
    organizer_name: 'Feihong',
  }
}


class CannedResponseGenerator extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      templateIndex: null,
      formValues: getDefaultFormValues(),
    }

    this.onFormChange = this.onFormChange.bind(this)
    this.onTemplateChange = this.onTemplateChange.bind(this)
  }

  render() {
    return <div>
      <TemplateSelect onChange={this.onTemplateChange} />

      <h2>Parameters</h2>
      <ParameterForm templateIndex={this.state.templateIndex}
                     formValues={this.state.formValues}
                     onChange={this.onFormChange}>
        <input name='name' />
        <DateSelect name='date' />
        <select name='no_show_count'>
          <option value='1'>1</option>
          <option value='2'>2</option>
        </select>
        <input name='event' />
        <input name='organizer_name' />
      </ParameterForm>

      <h2>Canned Response</h2>
      <CannedResponse templateIndex={this.state.templateIndex} formValues={this.state.formValues} />
    </div>
  }

  onTemplateChange(evt) {
    let index = evt.target.value
    index = (index === '') ? null : parseInt(index)
    this.setState({templateIndex: index})
  }

  onFormChange(name, value) {
    let newValues = Object.assign(this.state.formValues, {[name]: value})
    this.setState({formValues: newValues})
  }
}


class TemplateSelect extends React.Component {
  render() {
    return <div>
      <span>Template: </span>
      <select {...this.props}>
        <option value=''>----------------</option>
        {this.renderOptions()}
      </select>
    </div>
  }

  renderOptions() {
    return TEMPLATES.map((template, index) => {
      return <option key={index} value={index}>{template.name}</option>
    })
  }
}


class ParameterForm extends React.Component {
  render() {
    return <div className='form'>
      {this.renderChildren()}
    </div>
  }

  renderChildren() {
    return this.props.children.map((child) => {
      let callback = (evt) => this.onChildChange(child.props.name, evt.target.value)
      let extra = {
        onChange: callback,
        defaultValue: this.props.formValues[child.props.name],
      }
      let name = child.props.name
      return <div className={this.isHidden(name) ? 'hidden' : null}>
        <span>{name}: </span>
        {React.cloneElement(child, extra)}
      </div>
    })
  }

  isHidden(name) {
    let template = TEMPLATES[this.props.templateIndex]
    if (typeof template === 'undefined') {
      return true
    } else {
      return template.fields.indexOf(name) === -1
    }
  }

  onChildChange(name, value) {
    if (this.props.onChange) {
      this.props.onChange(name, value)
    }
  }
}
ParameterForm.propTypes = {
  onChange: React.PropTypes.func,
  formValues: React.PropTypes.object,
  templateIndex: React.PropTypes.number,
}


class DateSelect extends React.Component {
  render() {
    return <select {...this.props}>
      {this.renderOptions()}
    </select>
  }

  renderOptions() {
    let pairs = []
    for (let i=0; i < 7; i++) {
      let label = ''
      if (i === 0) {
        label = 'Today'
      } else if (i === 1) {
        label = 'Yesterday'
      } else {
        label = `${i} days ago`
      }
      let value = DateSelect.dateToString(moment().subtract(i, 'days'))
      pairs.push([label, value])
    }
    return pairs.map((pair) => {
      let [label, value] = pair
      return <option key={label} value={value}>{label}</option>
    })
  }
}
DateSelect.dateToString = function(date) {
  return date.format('dddd, MMMM Do')
}
DateSelect.getDefaultValue = function() {
  return DateSelect.dateToString(moment())
}


class CannedResponse extends React.Component {
  constructor(props) {
    super(props)
    this.templateCache = {}
    this.state = {
      generatedHtml: ''
    }
  }

  componentWillReceiveProps(newProps) {
    if (newProps.templateIndex === null) {
      this.setState({generatedHtml: ''})
    } else {
      if (newProps.templateIndex in this.templateCache) {
        this.setState({generatedHtml: this.generateHtml(newProps)})
        return
      }

      let template = TEMPLATES[newProps.templateIndex]
      $.get(BASE_URL + template.file + '.txt', (data) => {
        // Remove title and line
        let templateText = data.split(/={3,}/)[1].trim()
        this.templateCache[this.props.templateIndex] = _.template(templateText)
        this.setState({generatedHtml: this.generateHtml(newProps)})
      })
    }
  }

  render() {
    return <div className='canned-response'
      dangerouslySetInnerHTML={{__html: this.state.generatedHtml}} />
  }

  generateHtml(props) {
    let text = this.templateCache[props.templateIndex](props.formValues)
    return text.replace('\n', '<br>', 'g')
  }
}
CannedResponse.propTypes = {
  templateIndex: React.PropTypes.number,
  formValues: React.PropTypes.object,
}


ReactDOM.render(
  <CannedResponseGenerator />,
  document.getElementById('content')
)

//=============================================================================
});
