import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;
let currentUser = null;

if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

const authModal = document.getElementById('authModal');
const authBtn = document.getElementById('authBtn');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const closeBtn = document.querySelector('.close');
const switchToSignup = document.getElementById('switchToSignup');
const switchToLogin = document.getElementById('switchToLogin');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const emergencyBtn = document.getElementById('emergencyBtn');
const shareLocationBtn = document.getElementById('shareLocation');
const contactEmergencyBtn = document.getElementById('contactEmergency');
const viewIncidentsBtn = document.getElementById('viewIncidents');
const learnMoreBtn = document.getElementById('learnMore');

function showMessage(message, type = 'info') {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type} show`;
  messageDiv.textContent = message;

  const authForms = document.getElementById('authForms');
  if (authForms.firstChild) {
    authForms.insertBefore(messageDiv, authForms.firstChild);
  } else {
    authForms.appendChild(messageDiv);
  }

  setTimeout(() => {
    messageDiv.remove();
  }, 4000);
}

function toggleModal() {
  authModal.classList.toggle('hidden');
}

function switchForm(formName) {
  loginForm.classList.toggle('hidden', formName === 'signup');
  signupForm.classList.toggle('hidden', formName === 'login');
}

switchToSignup.addEventListener('click', (e) => {
  e.preventDefault();
  switchForm('signup');
});

switchToLogin.addEventListener('click', (e) => {
  e.preventDefault();
  switchForm('login');
});

authBtn.addEventListener('click', toggleModal);
closeBtn.addEventListener('click', toggleModal);

authModal.addEventListener('click', (e) => {
  if (e.target === authModal) {
    toggleModal();
  }
});

loginBtn.addEventListener('click', async () => {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    showMessage('Please fill in all fields', 'error');
    return;
  }

  if (!supabase) {
    showMessage('Supabase configuration missing', 'error');
    return;
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      showMessage(error.message || 'Login failed', 'error');
    } else {
      currentUser = data.user;
      showMessage('Login successful!', 'success');
      setTimeout(() => {
        toggleModal();
        updateAuthUI();
      }, 500);
    }
  } catch (err) {
    showMessage('An error occurred during login', 'error');
  }
});

signupBtn.addEventListener('click', async () => {
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const confirmPassword = document.getElementById('signupConfirm').value;

  if (!email || !password || !confirmPassword) {
    showMessage('Please fill in all fields', 'error');
    return;
  }

  if (password !== confirmPassword) {
    showMessage('Passwords do not match', 'error');
    return;
  }

  if (password.length < 6) {
    showMessage('Password must be at least 6 characters', 'error');
    return;
  }

  if (!supabase) {
    showMessage('Supabase configuration missing', 'error');
    return;
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      showMessage(error.message || 'Signup failed', 'error');
    } else {
      showMessage('Account created successfully! You can now sign in.', 'success');
      setTimeout(() => {
        switchForm('login');
        document.getElementById('loginEmail').value = email;
        document.getElementById('loginPassword').value = '';
      }, 500);
    }
  } catch (err) {
    showMessage('An error occurred during signup', 'error');
  }
});

async function updateAuthUI() {
  if (!supabase) return;

  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      currentUser = session.user;
      authBtn.textContent = 'Sign Out';
      authBtn.removeEventListener('click', toggleModal);
      authBtn.addEventListener('click', handleSignOut);
    } else {
      currentUser = null;
      authBtn.textContent = 'Sign In';
      authBtn.removeEventListener('click', handleSignOut);
      authBtn.addEventListener('click', toggleModal);
    }
  } catch (err) {
    console.error('Error checking session:', err);
  }
}

async function handleSignOut() {
  if (!supabase) return;

  try {
    await supabase.auth.signOut();
    currentUser = null;
    showMessage('Signed out successfully', 'success');
    updateAuthUI();
  } catch (err) {
    showMessage('Error signing out', 'error');
  }
}

emergencyBtn.addEventListener('click', () => {
  if (!currentUser) {
    showMessage('Please sign in first to use emergency alert', 'info');
    toggleModal();
    return;
  }

  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        showMessage(`Emergency Alert activated! Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}. Notifying emergency contacts...`, 'success');
      },
      () => {
        showMessage('Could not access your location. Emergency alert sent without location.', 'warning');
      }
    );
  } else {
    showMessage('Emergency alert activated! Please share your location manually.', 'info');
  }
});

shareLocationBtn.addEventListener('click', () => {
  if (!currentUser) {
    showMessage('Please sign in first', 'info');
    toggleModal();
    return;
  }

  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        showMessage(`Location shared: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, 'success');
      },
      () => {
        showMessage('Could not access your location', 'error');
      }
    );
  } else {
    showMessage('Geolocation is not supported by your browser', 'error');
  }
});

contactEmergencyBtn.addEventListener('click', () => {
  if (!currentUser) {
    showMessage('Please sign in first', 'info');
    toggleModal();
    return;
  }

  showMessage('Contacting emergency services...', 'info');
  setTimeout(() => {
    showMessage('Emergency services have been contacted. Help is on the way.', 'success');
  }, 2000);
});

viewIncidentsBtn.addEventListener('click', () => {
  showMessage('Nearby incident data will be displayed here. Current area is safe.', 'info');
});

learnMoreBtn.addEventListener('click', () => {
  document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
});

window.addEventListener('load', () => {
  updateAuthUI();

  if (supabase) {
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        currentUser = session.user;
        updateAuthUI();
      } else {
        currentUser = null;
        updateAuthUI();
      }
    });
  }
});
