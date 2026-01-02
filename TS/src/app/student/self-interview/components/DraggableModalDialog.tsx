import React, { createRef } from 'react'
import Draggable from 'react-draggable'
import { ModalDialog, ModalDialogProps } from 'react-bootstrap'

class DraggableModalDialog extends React.Component<ModalDialogProps> {
  nodeRef = createRef<HTMLDivElement>() // create a ref

  render() {
    return (
      <Draggable
        handle=".modal-header"
        nodeRef={this.nodeRef}  // pass ref here
      >
        <div ref={this.nodeRef}>
          <ModalDialog {...this.props} />
        </div>
      </Draggable>
    )
  }
}

export default DraggableModalDialog
