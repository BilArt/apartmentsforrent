import { useEffect, useState } from "react";
import "./App.css";

import { Routes, Route, useNavigate, useLocation } from "react-router-dom";

import { authApi } from "./api/auth";
import { fetchHealth } from "./api/health";

import HomePage from "./pages/HomePage/HomePage";
import ListingsPage from "./pages/ListingsPage/ListingsPage";
import ListingDetailsPage from "./pages/ListingDetailsPage/ListingDetailsPage";
import MyListingsPage from "./pages/MyListingsPage/MyListingsPage";
import RequestsPage from "./pages/RequestsPage/RequestsPage";
import ProfilePage from "./pages/ProfilePage/ProfilePage";

import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";

import BankIdModal from "./components/BankIdModal/BankIdModal";
import Modal from "./components/Modal/Modal";
import RegisterForm from "./components/RegisterForm/RegisterForm";
import SignInForm from "./components/SignInForm/SignInForm";
import ListingForm from "./components/ListingForm/ListingForm";

import ViewingRequestForm from "./components/ViewingRequestForm/ViewingRequestForm";

import RequireAuth from "./components/RequireAuth/RequireAuth";

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeModal, setActiveModal] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [bankIdMode, setBankIdMode] = useState(null);
  const [viewingListingId, setViewingListingId] = useState(null);

  // куда вернуться после успешного логина
  const [pendingNavigateTo, setPendingNavigateTo] = useState(null);

  const openSignIn = (opts = {}) => {
    if (opts?.from) setPendingNavigateTo(opts.from);
    setActiveModal("signin");
  };
  const openRegister = () => setActiveModal("register");
  const openAddListing = () => setActiveModal("addListing");

  const closeModal = () => {
    setActiveModal(null);
    setViewingListingId(null);
    setBankIdMode(null);
  };

  useEffect(() => {
    fetchHealth().catch(() => {});
  }, []);

  useEffect(() => {
    let alive = true;

    setAuthLoading(true);

    (async () => {
      try {
        const user = await authApi.me();
        if (!alive) return;
        setCurrentUser(user || null);
      } catch {
        if (!alive) return;
        setCurrentUser(null);
      } finally {
        if (alive) setAuthLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const handleRegistered = (user) => {
    setCurrentUser(user);
    setAuthLoading(false);
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
      setAuthLoading(false);
      setPendingNavigateTo(null);
      closeModal();
      navigate("/");
    }
  };

  const handleAddListingClick = () => {
    if (authLoading) return;

    if (!currentUser) {
      openSignIn({ from: location });
      return;
    }
    openAddListing();
  };

  const handleListingCreated = () => {
    closeModal();
    navigate("/listings");
  };

  const handleRequestViewing = (listingId) => {
    if (!listingId) return;

    if (authLoading || !currentUser) {
      setViewingListingId(listingId);
      openSignIn({ from: location });
      return;
    }

    setViewingListingId(listingId);
    setActiveModal("viewing");
  };

  const handleSignedInSmart = (user) => {
    setCurrentUser(user);
    setAuthLoading(false);

    // если логин был ради запроса на просмотр — сразу открываем форму
    if (viewingListingId) {
      setActiveModal("viewing");
      return;
    }

    closeModal();

    // вернуть на страницу, откуда попросили авторизацию
    if (pendingNavigateTo?.pathname) {
      const to = `${pendingNavigateTo.pathname}${pendingNavigateTo.search || ""}`;
      setPendingNavigateTo(null);
      navigate(to, { replace: true });
      return;
    }

    // фоллбек
    setPendingNavigateTo(null);
  };

  const isAuthed = !authLoading && Boolean(currentUser);

  return (
    <>
      <Header
        isAuthed={isAuthed}
        currentUser={currentUser}
        onAddListing={handleAddListingClick}
        onSignIn={() => openSignIn({ from: location })}
        onSignUp={openRegister}
        onLogout={handleLogout}
      />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/listings" element={<ListingsPage />} />

        <Route
          path="/profile"
          element={
            <RequireAuth
              currentUser={currentUser}
              authLoading={authLoading}
              onRequireAuth={() => openSignIn({ from: location })}
              fallback={
                <div className="container" style={{ padding: "28px 0" }}>
                  Перевіряємо сесію…
                </div>
              }
            >
              <ProfilePage
                currentUser={currentUser}
                authLoading={authLoading}
                onRequireAuth={() => openSignIn({ from: location })}
                onLogout={handleLogout}
              />
            </RequireAuth>
          }
        />

        <Route
          path="/my-listings"
          element={
            <RequireAuth
              currentUser={currentUser}
              authLoading={authLoading}
              onRequireAuth={() => openSignIn({ from: location })}
              fallback={
                <div className="container" style={{ padding: "28px 0" }}>
                  Перевіряємо сесію…
                </div>
              }
            >
              <MyListingsPage
                currentUser={currentUser}
                authLoading={authLoading}
                onRequireAuth={() => openSignIn({ from: location })}
              />
            </RequireAuth>
          }
        />

        <Route
          path="/requests"
          element={
            <RequireAuth
              currentUser={currentUser}
              authLoading={authLoading}
              onRequireAuth={() => openSignIn({ from: location })}
              fallback={
                <div className="container" style={{ padding: "28px 0" }}>
                  Перевіряємо сесію…
                </div>
              }
            >
              <RequestsPage
                currentUser={currentUser}
                authLoading={authLoading}
                onRequireAuth={() => openSignIn({ from: location })}
              />
            </RequireAuth>
          }
        />

        <Route
          path="/listings/:listingId"
          element={
            <ListingDetailsPage
              currentUser={currentUser}
              onRequestViewing={handleRequestViewing}
            />
          }
        />
      </Routes>

      <Footer />

      {activeModal === "signin" && (
        <Modal title="Увійти" onClose={closeModal}>
          <SignInForm
            onSignedIn={handleSignedInSmart}
            onGoSignUp={openRegister}
            onBankId={openBankIdSignIn}
          />
        </Modal>
      )}

      {activeModal === "register" && (
        <Modal title="Реєстрація" onClose={closeModal}>
          <RegisterForm
            onRegistered={handleRegistered}
            onGoSignIn={() => openSignIn({ from: location })}
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
              setAuthLoading(false);

              if (viewingListingId) {
                setActiveModal("viewing");
                return;
              }

              closeModal();

              if (pendingNavigateTo?.pathname) {
                const to = `${pendingNavigateTo.pathname}${pendingNavigateTo.search || ""}`;
                setPendingNavigateTo(null);
                navigate(to, { replace: true });
              } else {
                setPendingNavigateTo(null);
              }
            }}
          />
        </Modal>
      )}

      {activeModal === "viewing" && viewingListingId && (
        <Modal title="Запит на перегляд" onClose={closeModal}>
          <ViewingRequestForm
            listingId={viewingListingId}
            onCancel={closeModal}
            onSuccess={closeModal}
          />
        </Modal>
      )}
    </>
  );
}

export default App;
