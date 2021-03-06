import React, {Component} from 'react'
import pureRender from 'pure-render-decorator'
import {connect} from 'react-redux'
import * as actions from '../actions'
import AnimationButtons from '../components/animation-buttons'
import Slider from 'rc-slider'
import ccLogoSrc from '../../images/cc-logo.png'
import screenfull from 'screenfull'
import {layerInfo} from '../map-layer-tiles'
import log from '../logger'

import '../../css/bottom-controls.less'
import '../../css/settings-controls.less'
import 'rc-slider/assets/index.css'
import '../../css/slider.less'

function sliderDateFormatter(value) {
  const date = new Date(value)
  // .getMoth() returns [0, 11] range.
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
}

function sliderTickFormatter(valueMin, valueMax) {
  // Don't display decade labels if it's closer to the edge values than 4 years.
  // Labels would be too close to each other and probably overlap.
  const minDistFromEdgeValues = 4 // years
  const tickMarks = {}
  const minDate = new Date(valueMin)
  const minYear = (minDate.getFullYear() + minDistFromEdgeValues).toString()
  const maxDate = new Date(valueMax)
  maxDate.setFullYear(maxDate.getUTCFullYear() - minDistFromEdgeValues, 0, 1)

  const decade = new Date(minYear.substr(0, 2) + minYear.substr(2, 1) + '0')
  decade.setFullYear(decade.getUTCFullYear() + 10, 0, 1)
  while (decade <= maxDate) {
    tickMarks[decade.getTime()] = {label: decade.getUTCFullYear()}
    // increment decade by 10 years
    decade.setFullYear(decade.getUTCFullYear() + 10, 0, 1)
  }
  return tickMarks
}

function toggleFullscreen() {
  if (!screenfull.isFullscreen) {
    screenfull.request()
    log('FullscreenClicked')
  } else {
    screenfull.exit()
    log('ExitFullscreenClicked')
  }
}

function logTimeSliderChange(value) {
  log('TimeSliderChanged', {minTime: (new Date(value[0])).toString(), maxTime: (new Date(value[1])).toString()})
}

function logMagSliderChange(value) {
  log('MagnitudeSliderChanged', {minMag: value[0], maxMag: value[1]})
}

@pureRender
class BottomControls extends Component {
  constructor(props) {
    super(props)
    this.state = {
      fullscreen: false
    }
    this.handleTimeRange = this.handleTimeRange.bind(this)
    this.handleMagRange = this.handleMagRange.bind(this)
    this.handleBaseLayerChange = this.handleBaseLayerChange.bind(this)
    this.handlePlateLayerChange = this.handlePlateLayerChange.bind(this)
    this.handleAnimStep = this.handleAnimStep.bind(this)
    this.handlePlayPauseBtnClick = this.handlePlayPauseBtnClick.bind(this)
    this.handleResetBtnClick = this.handleResetBtnClick.bind(this)
    this.handleEarthquakeLayerChange = this.handleEarthquakeLayerChange.bind(this)
  }

  componentDidMount() {
    if (screenfull.enabled) {
      document.addEventListener(screenfull.raw.fullscreenchange, () => {
        this.setState({fullscreen: screenfull.isFullscreen})
      })
    }
  }

  handleTimeRange(value) {
    const {setFilter} = this.props
    setFilter('minTime', value[0])
    setFilter('maxTime', value[1])
  }

  handleMagRange(value) {
    const {setFilter} = this.props
    setFilter('minMag', value[0])
    setFilter('maxMag', value[1])
  }

  handleBaseLayerChange(event) {
    const {setBaseLayer} = this.props
    const layer = event.target.value
    setBaseLayer(layer)
    log('MapLayerChanged', {layer})
  }

  handlePlateLayerChange(event) {
    const {setPlatesVisible} = this.props
    const visible = event.target.checked
    setPlatesVisible(visible)
    log('PlatesVisibilityChanged', {visible})
  }

  handleAnimStep(newValue) {
    const {filters, setFilter, setAnimationEnabled} = this.props
    if (newValue > filters.get('maxTimeLimit')) {
      newValue = filters.get('maxTimeLimit')
      setAnimationEnabled(false)
    }
    setFilter('maxTime', newValue)
  }

  handlePlayPauseBtnClick() {
    const {animationEnabled, setAnimationEnabled} = this.props
    setAnimationEnabled(!animationEnabled)
    log(animationEnabled ? 'PauseClicked' : 'PlayClicked')
  }

  handleResetBtnClick() {
    const {reset} = this.props
    reset()
    log('ResetClicked')
  }

  handleEarthquakeLayerChange(event) {
    const {setEarthquakesVisible} = this.props
    const visible = event.target.checked
    setEarthquakesVisible(visible)
    log("show earthquakes", {visible})
  }

  get dateMarks() {
    const {filters} = this.props
    const min = filters.get('minTimeLimit')
    const max = filters.get('maxTimeLimit')
    let marks = {
      [min]: {label: sliderDateFormatter(min)},
      [max]: {label: sliderDateFormatter(max)}
    }
    if (min != 0 && max != 0) {
      // add tick marks for each decade between min and max
      Object.assign(marks, sliderTickFormatter(min, max))
    }
    return marks
  }

  get mapLayerOptions() {
    return layerInfo.map((m, idx) => <option key={idx} value={m.type}>{m.name}</option>)
  }

  get animSpeed() {
    const {filters} = this.props
    return (filters.get('maxTimeLimit') - filters.get('minTimeLimit')) / 15000
  }

  get fullscreenIconStyle() {
    return this.state.fullscreen ? 'fullscreen-icon fullscreen' : 'fullscreen-icon';
  }

  render() {
    const {animationEnabled, filters, layers, mode, earthquakesCount, earthquakesCountVisible, magnitudeCutOff} = this.props
    const minMag = filters.get('minMag')
    const maxMag = filters.get('maxMag')
    let magFilter = magnitudeCutOff > 0

    return (
      <div>
        <div className='bottom-controls'>
          <div>
            <AnimationButtons ref='playButton' animationEnabled={animationEnabled} value={filters.get('maxTime')}
                              speed={this.animSpeed}
                              onPlayPause={this.handlePlayPauseBtnClick} onReset={this.handleResetBtnClick}
                              onAnimationStep={this.handleAnimStep}/>
          </div>
          <div className='center'>
            <Slider className='slider-big' range min={filters.get('minTimeLimit')} max={filters.get('maxTimeLimit')}
                    step={86400} value={[filters.get('minTime'), filters.get('maxTime')]}
                    onChange={this.handleTimeRange} onAfterChange={logTimeSliderChange}
                    tipFormatter={sliderDateFormatter} marks={this.dateMarks}/>
          </div>
          {screenfull.enabled &&
          <div className={this.fullscreenIconStyle} onClick={toggleFullscreen} title="Toggle Fullscreen">
          </div>
          }
        </div>
        <div className='settings'>
          <div>
            <img src={ccLogoSrc}/>
          </div>
          <div title="Change the map rendering style">
            Map type
            <select value={layers.get('base') } onChange={this.handleBaseLayerChange}>
              {this.mapLayerOptions}
            </select>
          </div>
          {mode !== '3d' &&
          <div title="Show Plate Boundaries Overlay">
            <input type='checkbox' checked={layers.get('plates') } onChange={this.handlePlateLayerChange}
                   id='plate-border-box'/>
            <label htmlFor='plate-border-box'>Plate boundaries</label>
          </div>
          }
          <div>
            <div className='mag-label'>Magnitudes from <strong>{minMag.toFixed(1)}</strong> to <strong>{maxMag.toFixed(1)}</strong></div>
            <div className='mag-slider'>
              <Slider range min={0} max={10} step={0.1} value={[minMag, maxMag]} onChange={this.handleMagRange}
                      onAfterChange={logMagSliderChange} marks={{0: 0, 5: 5, 10: 10}}/>
            </div>
            <div className='toggle-earthquakes' title="Show or hide all earthquakes on the map"><input type="checkbox" id="earthquake-toggle" checked={layers.get('earthquakes')} onChange={this.handleEarthquakeLayerChange} /><label htmlFor='earthquake-toggle'>Show Earthquakes</label></div>
            <div className='stats'>
              <span>Currently displaying <strong>{earthquakesCountVisible}</strong> of <strong>{earthquakesCount}</strong> earthquakes </span>
              {magFilter && <span>starting from magnitude <strong>{magnitudeCutOff}</strong>. Zoom in to see weaker earthquakes.</span>}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    filters: state.get('filters'),
    layers: state.get('layers'),
    mode: state.get('mode'),
    animationEnabled: state.get('animationEnabled'),
    earthquakesCount: state.get('data').get('earthquakes').length,
    earthquakesCountVisible: state.get('data').get('earthquakes').filter(e => e.visible).length,
    magnitudeCutOff: state.get('data').get('magnitudeCutOff')
  }
}

export default connect(mapStateToProps, actions)(BottomControls)
