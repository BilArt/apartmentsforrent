import { useState } from "react";
import "./App.css";

import Button from "./components/Button/Button";
import Modal from "./components/Modal/Modal";
import RegisterForm from "./components/RegisterForm/RegisterFrom";
import SignInForm from "./components/SignInForm/SignInForm";

function App() {
  const [activeModal, setActiveModal] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const openSignIn = () => setActiveModal("signin");
  const openRegister = () => setActiveModal("register");
  const closeModal = () => setActiveModal(null);

  const handleRegistered = (user) => {
    setCurrentUser(user);
    closeModal();
  };

  const handleSignedIn = (user) => {
    setCurrentUser(user);
    closeModal();
  };

  const hadnleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <>
      <div>
        <h1>Apartments for rent</h1>

        {currentUser && (
          <>
            <p>
              Добрий день, {currentUser.firstName}! Ваш рейтинг:{" "}
              {currentUser.rating}
            </p>
            <div className="flex">
              <button onClick={hadnleLogout}>Вийти</button>
            </div>
          </>
        )}

        <div className="flex">
          <Button onClick={openSignIn}>SignIn</Button>
          <Button onClick={openRegister}>Register</Button>
        </div>
      </div>

      {activeModal === "signin" && (
        <Modal title="Sign In with BankID mock" onClose={closeModal}>
          <SignInForm onSignedIn={handleSignedIn} />
        </Modal>
      )}

      {activeModal === "register" && (
        <Modal title="Register new user" onClose={closeModal}>
          <RegisterForm onRegistered={handleRegistered} />
        </Modal>
      )}
    </>
  );
}

export default App;
