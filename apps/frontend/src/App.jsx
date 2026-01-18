import { useEffect, useState } from "react";
import "./App.css";

import { authApi } from "./api/auth";
import { fetchHealth } from "./api/health";
import { listingsApi } from "./api/listings";

import Header from "./components/Header/Header";
import Hero from "./components/Hero/Hero";
import Benefits from "./components/Benefits/Benefits";
import HowItWorks from "./components/HowItWorks/HowItWorks";
import Footer from "./components/Footer/Footer";

import Button from "./components/Button/Button";
import Modal from "./components/Modal/Modal";
import RegisterForm from "./components/RegisterForm/RegisterForm";
import SignInForm from "./components/SignInForm/SignInForm";
import ListingCard from "./components/ListingCard/ListingCard";
import ListingForm from "./components/ListingForm/ListingForm";

function App() {
  const [activeModal, setActiveModal] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("tenant");
  const [apiStatus, setApiStatus] = useState("checking...");

  const [allListings, setAllListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [listingsError, setListingsError] = useState(null);

  const openSignIn = () => setActiveModal("signin");
  const openRegister = () => setActiveModal("register");
  const openAddListing = () => setActiveModal("addListing");
  const closeModal = () => setActiveModal(null);

  // 1) Checking API health
  useEffect(() => {
    fetchHealth()
      .then(() => setApiStatus("API: OK"))
      .catch(() => setApiStatus("API: FAIL"));
  }, []);

  // 2) Session recovery
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

    // landlord tab
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

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      setCurrentUser(null);
      setActiveTab("tenant");
      closeModal();
    }
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
        onAddListing={openAddListing}
        onSignIn={openSignIn}
        onLogout={handleLogout}
      />
      <Hero />
      <Benefits />
      <HowItWorks />
      <Footer />
    
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
      {activeModal === "addListing" && currentUser && (
        <Modal title="Додати оголошення" onClose={closeModal}>
          <ListingForm onCreated={handleListingCreated} />
        </Modal>
      )}
    </>
  );
}

export default App;
