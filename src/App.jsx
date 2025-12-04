import { useState } from 'react'
import './App.css'

import Button from './components/Button/Button'

function App() {

  return (
    <>
      <div>
        <h1>Apartments for rent</h1>
        <div className='flex'>
          <Button>SignIn</Button>
          <Button>Register</Button>
        </div>
      </div>
    </>
  )
}

export default App
