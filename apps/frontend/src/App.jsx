import { useEffect, useState } from "react";
import "./App.css";

import { authApi } from "./api/auth";
import { fetchHealth } from "./api/health";
import { listingsApi } from "./api/listings";

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
      <p>{apiStatus}</p>

      <div>
        <h1>Apartments for rent</h1>

        {currentUser ? (
          <>
            <p>
              Добрий день, {currentUser.firstName}! Ваш рейтинг:{" "}
              {currentUser.rating}
            </p>

            <div className="flex">
              <Button onClick={handleLogout}>Log out</Button>
            </div>

            <div className="tabs">
              <Button
                variant={activeTab === "landlord" ? "primary" : "secondary"}
                onClick={() => setActiveTab("landlord")}
              >
                Для орендодавців
              </Button>

              <Button
                variant={activeTab === "tenant" ? "primary" : "secondary"}
                onClick={() => setActiveTab("tenant")}
              >
                Для орендаторів
              </Button>
            </div>

            {activeTab === "landlord" && (
              <div className="actions">
                <Button onClick={openAddListing}>Додати оголошення</Button>
              </div>
            )}

            <div className="listings">
              {listingsError && <p>{listingsError}</p>}

              {activeTab === "landlord" ? (
                myListings.length ? (
                  myListings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))
                ) : (
                  <p>Наразі у Вас немає оголошень.</p>
                )
              ) : (
                allListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <p>Увійдіть або зареєструйтеся.</p>
            <div className="flex">
              <Button onClick={openSignIn}>Увійти</Button>
              <Button onClick={openRegister}>Зареєструватися</Button>
            </div>
          </>
        )}
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

      {activeModal === "addListing" && currentUser && (
        <Modal title="Додати оголошення" onClose={closeModal}>
          <ListingForm onCreated={handleListingCreated} />
        </Modal>
      )}
    </>
  );
}

export default App;
