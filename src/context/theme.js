import React, { useState, useEffect } from 'react'

export function isStoreDarkMode() {
  return localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
}

export function toggleTheme() {
  document.documentElement.classList.toggle('dark')
  localStorage.theme = localStorage.theme === 'dark'
    ? 'light'
    : 'dark'
}

const ThemeContext = React.createContext({
  theme: 'light',
  toggleTheme: () => {}
})

export const useDarkTheme = () => {
  const [darkMode, setDarkMode] = useState(process.browser &&
    document.documentElement.classList.contains('dark'))
  useEffect(() => {
    const el = document.documentElement
    function mutationCallback(mutations, observer) {
      setDarkMode(mutations[0].target.classList.contains('dark'))
      console.log('mutate')
    }
    const observer = new MutationObserver(mutationCallback)
    observer.observe(el, { attributes: true })
    return () => observer.disconnect()
  }, [])
  return [darkMode, toggleTheme]
}


export default ThemeContext

