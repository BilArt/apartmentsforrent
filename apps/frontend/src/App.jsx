import { useEffect, useState } from "react";
import "./App.css";

import { Routes, Route, useNavigate } from "react-router-dom";

import { authApi } from "./api/auth";
import { fetchHealth } from "./api/health";

import HomePage from "./pages/HomePage/HomePage";
import ListingsPage from "./pages/ListingsPage/ListingsPage";
import ListingDetailsPage from "./pages/ListingDetailsPage/ListingDetailsPage";

import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";

import BankIdModal from "./components/BankIdModal/BankIdModal";
import Modal from "./components/Modal/Modal";
import RegisterForm from "./components/RegisterForm/RegisterForm";
import SignInForm from "./components/SignInForm/SignInForm";
import ListingForm from "./components/ListingForm/ListingForm";
import ViewingRequestForm from "./components/ViewingRequestForm/ViewingRequestForm";

function App() {
  const navigate = useNavigate();

  const [activeModal, setActiveModal] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [apiStatus, setApiStatus] = useState("checking...");
  const [bankIdMode, setBankIdMode] = useState(null);

  const [viewingListingId, setViewingListingId] = useState(null);

  const openSignIn = () => setActiveModal("signin");
  const openRegister = () => setActiveModal("register");
  const openAddListing = () => setActiveModal("addListing");

  const closeModal = () => {
    setActiveModal(null);
    setViewingListingId(null);
  };

  const openViewingRequest = (listingId) => {
    setViewingListingId(listingId);
    setActiveModal("viewing");
  };

  useEffect(() => {
    fetchHealth()
      .then(() => setApiStatus("API: OK"))
      .catch(() => setApiStatus("API: FAIL"));
  }, []);

  useEffect(() => {
    authApi
      .me()
      .then((user) => {
        if (user) setCurrentUser(user);
      })
      .catch(() => {});
  }, []);

  const handleRegistered = (user) => {
    setCurrentUser(user);
    closeModal();
  };

  const handleSignedIn = (user) => {
    setCurrentUser(user);
    closeModal();
  };

  const openBankIdSignIn = () => {
    setBankIdMode("signin");
    setActiveModal("bankid");
  };

  const openBankIdRegister = () => {
    setBankIdMode("register");
    setActiveModal("bankid");
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      setCurrentUser(null);
      closeModal();
      navigate("/");
    }
  };

  const handleAddListingClick = () => {
    if (!currentUser) {
      openSignIn();
      return;
    }
    openAddListing();
  };

  const handleListingCreated = () => {
    closeModal();
    navigate("/listings");
  };

  return (
    <>
      <Header
        isAuthed={Boolean(currentUser)}
        onAddListing={handleAddListingClick}
        onSignIn={openSignIn}
        onSignUp={openRegister}
        onLogout={handleLogout}
      />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/listings" element={<ListingsPage />} />
        <Route
          path="/listings/:listingId"
          element={<ListingDetailsPage onRequestViewing={openViewingRequest} />}
        />
      </Routes>

      <Footer />

      {activeModal === "signin" && (
        <Modal title="Увійти" onClose={closeModal}>
          <SignInForm
            onSignedIn={handleSignedIn}
            onGoSignUp={openRegister}
            onBankId={openBankIdSignIn}
          />
        </Modal>
      )}

      {activeModal === "register" && (
        <Modal title="Реєстрація" onClose={closeModal}>
          <RegisterForm
            onRegistered={handleRegistered}
            onGoSignIn={openSignIn}
            onBankId={openBankIdRegister}
          />
        </Modal>
      )}

      {activeModal === "addListing" && currentUser && (
        <Modal title="Додати оголошення" onClose={closeModal}>
          <ListingForm onCreated={handleListingCreated} />
        </Modal>
      )}

      {activeModal === "viewing" && (
        <Modal title="Запросити перегляд" onClose={closeModal}>
          <ViewingRequestForm
            listingId={viewingListingId}
            onSubmitted={closeModal}
          />
        </Modal>
      )}

      {activeModal === "bankid" && (
        <Modal
          title={
            bankIdMode === "register"
              ? "Зареєструйте особу через BankID"
              : "Підтвердіть особу через BankID"
          }
          onClose={closeModal}
        >
          <BankIdModal
            mode={bankIdMode}
            onCancel={closeModal}
            onAuthed={(user) => {
              setCurrentUser(user);
              closeModal();
            }}
          />
        </Modal>
      )}
    </>
  );
}

export default App;
