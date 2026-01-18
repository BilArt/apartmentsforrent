import { useEffect, useState } from "react";
import "./App.css";

import { Routes, Route } from "react-router-dom";

import { authApi } from "./api/auth";
import { fetchHealth } from "./api/health";
import { listingsApi } from "./api/listings";

import HomePage from "./pages/HomePage/HomePage";
import ListingsPage from "./pages/ListingsPage/ListingsPage";

import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";

import BankIdModal from "./components/BankIdModal/BankIdModal";
import Modal from "./components/Modal/Modal";
import RegisterForm from "./components/RegisterForm/RegisterForm";
import SignInForm from "./components/SignInForm/SignInForm";
import ListingForm from "./components/ListingForm/ListingForm";

function App() {
  const [activeModal, setActiveModal] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("tenant");
  const [apiStatus, setApiStatus] = useState("checking...");

  const [allListings, setAllListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [listingsError, setListingsError] = useState(null);
  const [bankIdMode, setBankIdMode] = useState(null);

  const openSignIn = () => setActiveModal("signin");
  const openRegister = () => setActiveModal("register");
  const openAddListing = () => setActiveModal("addListing");
  const closeModal = () => setActiveModal(null);

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

  useEffect(() => {
    setListingsError(null);

    if (activeTab === "tenant") {
      listingsApi
        .getAll()
        .then(setAllListings)
        .catch((e) => setListingsError(e.message));
      return;
    }

    if (!currentUser) {
      setMyListings([]);
      return;
    }

    listingsApi
      .getMy()
      .then(setMyListings)
      .catch((e) => setListingsError(e.message));
  }, [activeTab, currentUser]);

  const handleRegistered = (user) => {
    setCurrentUser(user);
    setActiveTab("tenant");
    closeModal();
  };

  const handleSignedIn = (user) => {
    setCurrentUser(user);
    setActiveTab("tenant");
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
      setActiveTab("tenant");
      closeModal();
    }
  };

  const handleAddListingClick = () => {
    if (!currentUser) {
      openSignIn();
      return;
    }
    openAddListing();
  };

  const handleListingCreated = async () => {
    setActiveTab("landlord");
    closeModal();

    try {
      const fresh = await listingsApi.getMy();
      setMyListings(fresh);
    } catch (e) {
      setListingsError(e.message);
    }
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
              setActiveTab("tenant");
              closeModal();
            }}
          />
        </Modal>
      )}
    </>
  );
}

export default App;
