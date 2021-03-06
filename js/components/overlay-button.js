import React, { Component } from 'react'
import pureRender from 'pure-render-decorator'

import '../../css/overlay-button.less'

@pureRender
export default class OverlayButton extends Component {
  render() {
    const { onClick, disabled, children, icon, className } = this.props
    return (
      <div className={`overlay-button ${className} ${disabled ? 'disabled' : ''} ${icon && !children ? 'icon-only' : ''}`}
           onClick={onClick}>
        {icon && <i className={`fa fa-${icon}`}/>}
        {children}
      </div>
    )
  }
}
