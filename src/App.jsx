// src/App.jsx
import { useState } from 'react';
import './App.css';
import Button from './components/Button/Button';
import Modal from './components/Modal/Modal';

function App() {
  const [activeModal, setActiveModal] = useState(null); 

  const openSignIn = () => setActiveModal('signin');
  const openRegister = () => setActiveModal('register');
  const closeModal = () => setActiveModal(null);

  return (
    <>
      <div>
        <h1>Apartments for rent</h1>
        <div className="flex">
          <Button onClick={openSignIn}>SignIn</Button>
          <Button onClick={openRegister}>Register</Button>
        </div>
      </div>

      {activeModal === 'signin' && (
        <Modal title="Sign In with BankID mock" onClose={closeModal}>
          {/* тут пока просто заглушка, логику добавим позже */}
          <p>Здесь будет логин через мок-BankID.</p>
        </Modal>
      )}

      {activeModal === 'register' && (
        <Modal title="Register new user" onClose={closeModal}>
          {/* тут будет форма регистрации */}
          <p>Здесь будет форма регистрации пользователя.</p>
        </Modal>
      )}
    </>
  );
}

export default App;
