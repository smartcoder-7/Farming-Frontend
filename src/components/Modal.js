import { memo, useEffect } from 'react'
import { createPortal } from 'react-dom'

const Modal = ({ closeModal, containerId = 'modal-container', children }) => {

  useEffect(() => {
    const closeOnEsc = e => {
      if (e.key === 'Escape') {
        closeModal()
      }
    }
    document.body.addEventListener('keydown', closeOnEsc)
    document.body.classList.add('modal-open')
    return () => {
      document.body.classList.remove('modal-open')
      document.body.removeEventListener('keydown', closeOnEsc)
    }
  }, [])

  return createPortal((
    <div
      className="fixed z-50 inset-0 max-h-screen p-6 sm:p-12 bg-black
      bg-opacity-60 flex justify-center items-center flex-col"
      onClick={closeModal}
    >
      <div
        className="bg-gray-100 dark:bg-gray-900 rounded-3xl
        overflow-hidden p-4 sm:p-8 pb-0 sm:pb-0 max-w-md w-full flex flex-col
        space-y-4"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  ), document.getElementById(containerId))
}

export default Modal

