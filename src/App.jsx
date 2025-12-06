import { useState } from "react";
import "./App.css";

import Button from "./components/Button/Button";
import Modal from "./components/Modal/Modal";
import RegisterForm from "./components/RegisterForm/RegisterFrom";
import SignInForm from "./components/SignInForm/SignInForm";
import ListingCard from "./components/ListingCard/ListingCard";
import ListingForm from "./components/ListingForm/ListingForm";

import { getAllListings, getListingsByLandlordId } from "./mock/listingsDb";

function App() {
  const [activeModal, setActiveModal] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("tenant");

  const openSignIn = () => setActiveModal("signin");
  const openRegister = () => setActiveModal("register");
  const openAddListing = () => setActiveModal("addListing");
  const closeModal = () => setActiveModal(null);

  const handleRegistered = (user) => {
    setCurrentUser(user);
    closeModal();
  };

  const handleSignedIn = (user) => {
    setCurrentUser(user);
    closeModal();
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleListingCreated = () => {
    setActiveTab("landlord");
    closeModal();
  };

  const allListings = getAllListings();
  const landlordListings = currentUser
    ? getListingsByLandlordId(currentUser.id)
    : [];

  return (
    <>
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
              {activeTab === "landlord" ? (
                landlordListings.length ? (
                  landlordListings.map((listing) => (
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
          <ListingForm
            currentUser={currentUser}
            onCreated={handleListingCreated}
          />
        </Modal>
      )}
    </>
  );
}

export default App;
