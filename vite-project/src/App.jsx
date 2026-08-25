import React, { useState } from "react";
import "./App.css";

function App() {
  const [page, setPage] = useState("home");
  const [authPage, setAuthPage] = useState("welcome");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [dietType, setDietType] = useState("Veg");
  const [caste, setCaste] = useState("");
  const [diseases, setDiseases] = useState("");
  const [result, setResult] = useState(null);
  const [showChat, setShowChat] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const API_URL = import.meta.env.VITE_API_URL;

fetch(`${API_URL}/ping`)

  
  const handleLogin = async (e) => {
    e.preventDefault();

    const formData = new URLSearchParams();
    formData.append("username", email.split("@")[0]);

    formData.append("password", password);

    try {
      const response = await fetch("http://127.0.0.1:8000/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.access_token);
        alert("Login successful!");
        setAuthPage("home");
      } else {
        alert("Login failed: " + data.detail);
      }
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  
  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://127.0.0.1:8000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: email.split("@")[0],
          full_name: name,
          email,
          password,
          disabled: false,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Signup successful! You can now sign in.");
        setAuthPage("signIn");
      } else {
        alert("Signup failed: " + data.detail);
      }
    } catch (err) {
      console.error("Signup error:", err);
    }
  };

  
  const handleAnalyze = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first!");
      setAuthPage("signIn");
      return;
    }

    const data = { age, height, weight, dietType, caste, diseases };

    try {
      const response = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const res = await response.json();
      if (response.ok) {
        setResult(res);
        setPage("result");
      } else {
        alert(" Error: " + res.detail);
      }
    } catch (error) {
      console.error("Analyze error:", error);
      alert("Backend error. Check console.");
    }
  };



function DeveloperButton() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="developer-section">
      <button className="about-dev-btn" onClick={() => setShowModal(true)}>
        About Developer
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowModal(false)}>
              ✖
            </button>
            <h2>About PrepWise</h2>
            <p>
              <strong>PrepWise</strong> is a personalized meal recommendation and
              health tracking system designed to provide intelligent, data-driven
              dietary suggestions. It combines <b>FastAPI</b>, <b>MongoDB</b>, and
              <b>React.js</b> to securely handle user data, calculate BMI, and
              deliver tailored meal plans that support healthy living.
            </p>
            <hr />
            <img
              src="C:\Users\sagni\Downloads\WhatsApp Image 2025-10-30 at 3.00.01 AM.jpeg"
              alt="Sagnik Bhattacharyya"
              className="dev-photo"
            />
            <h3>Created by Sagnik Bhattacharyya</h3>
            <p>
              3rd Year Engineering Student, Electronics and Communication
              Engineering<br />
              Institute of Engineering and Management, Kolkata, India.
            </p>
            <p>
              Passionate about building intelligent systems that combines AI and
              database management to improve daily life.
            </p>
            <div className="social-links">
              
              <a
                href="https://github.com/SAGNIK890"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
              <a href="mailto:sagnikbhattacharyya82@gmail.com">Gmail</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




  
  const renderContent = () => {
    if (authPage === "welcome") {
      
      return (
        <div className="content">
           <video className="video-bg" autoPlay loop muted playsInline>
          <source
            src="https://cdn.pixabay.com/video/2022/08/29/129502-744385593_tiny.mp4"
            type="video/mp4"
          />
        </video>
          <h1 className="titlee">Welcome to PrepWise</h1>
          <p className="taglinee">Track your health & personalize your meals</p>
          <button className="btn" onClick={() => setAuthPage("signIn")}>
            Sign In
          </button>
          <button className="btn" onClick={() => setAuthPage("signUp")}>
            Sign Up
          </button>
        </div>
      );
    }

    if (authPage === "signIn") {
      return (
        <div className="content">
          <h1 className="title">Sign In</h1>
          <form className="form" onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button className="btn" type="submit">
              Login
            </button>
          </form>
          <p style={{ color: "#ccc", marginTop: "1rem" }}>
            Don't have an account?{" "}
            <span
              onClick={() => setAuthPage("signUp")}
              style={{ color: "#00ffc3", cursor: "pointer" }}
            >
              Sign Up
            </span>
          </p>
        </div>
      );
    }

    if (authPage === "signUp") {
      return (
        <div className="content">
          <h1 className="title">Create Account</h1>
          <form className="form" onSubmit={handleSignup}>
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button className="btn" type="submit">
              Register
            </button>
          </form>
          <p style={{ color: "#ccc", marginTop: "1rem" }}>
            Already have an account?{" "}
            <span
              onClick={() => setAuthPage("signIn")}
              style={{ color: "#00ffc3", cursor: "pointer" }}
            >
              Sign In
            </span>
          </p>
        </div>
      );
    }

      
  if (page === "home") {
    return (
      <div className="app">
        <video className="video-bg" autoPlay loop muted playsInline>
          <source
            src="https://cdn.pixabay.com/video/2022/08/29/129502-744385593_tiny.mp4"
            type="video/mp4"
          />
        </video>

        <div className="content">
          <h1 className="title">PrepWise</h1>
          <p className="tagline"> Let's Get Your Macros Sorted! </p>

          <form className="form" onSubmit={handleAnalyze}>
            <input
              type="number"
              min="1"
              placeholder="Age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
            />
            <input
              type="number"
              min="20"
              placeholder="Height (cm)"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              required
            />
            <input
              type="number"
              min="10"
              placeholder="Weight (kg)"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
            />
            <select value={dietType} onChange={(e) => setDietType(e.target.value)}>
              <option value="Veg">Vegetarian</option>
              <option value="Non-Veg">Non-Vegetarian</option>
            </select>
            <input
              type="text"
              placeholder="Religion (Optional)"
              value={caste}
              onChange={(e) => setCaste(e.target.value)}
            />
            <input
              type="text"
              placeholder="Existing Diseases"
              value={diseases}
              onChange={(e) => setDiseases(e.target.value)}
            />
            <button type="submit" className="btn">Get Meal Plan</button>
          </form>

             
<div className="coming-soon">🚧 PrepWise is Coming Soon!</div>



<footer className="footer">
  <div className="socials">
    <a href="https://twitter.com/prepwise" target="_blank" rel="noopener noreferrer">🐦 Twitter</a>
    <a href="https://www.linkedin.com/company/prepwise" target="_blank" rel="noopener noreferrer">💼 LinkedIn</a>
    <a href="mailto:contact@prepwise.ai">✉️ contact@prepwise.ai</a>
  </div>
  <p>© {new Date().getFullYear()} PrepWise. All Rights Reserved.</p>
</footer>

<a
  href="https://wa.me/9547475503"
  className="whatsapp-float"
  target="_blank"
  rel="noopener noreferrer"
>
Connect with us
</a>

        </div>
      </div>
    );
  }

 
 if (page === "result" && result) {
  return (
    <div className="app">
      <video className="video-bg" autoPlay loop muted playsInline>
        <source
          src="https://cdn.pixabay.com/video/2021/08/19/85590-590014592_large.mp4"
          type="video/mp4"
        />
      </video>

      <div className="result-grid">
        {/* BMI Section */}
        <div className="result-card">
          <h2>Your BMI: {result.bmi}</h2>
          <p>{result.category}</p>
        </div>

        {/* Macro-Agent Suggests */}
        <div className="result-card">
          <h2>{result.agent} Suggests</h2>
          <p>
            <strong>{result.agent}</strong> :: {result.strategy}
          </p>

          <div className="meal-list">
            {Object.entries(result.meal_plan).map(([meal, items]) => (
              <div key={meal} className="meal-block">
                <h3>{meal.charAt(0).toUpperCase() + meal.slice(1)}</h3>
                <ul>
                  {items.map((item, idx) => (
                    <li key={idx}>
                      {item.name || item.hint || JSON.stringify(item)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Macros */}
        <div className="result-card">
          <h2>Macros:</h2>
          <ul>
            {result.hints.map((hint, idx) => (
              <li key={idx}>{hint}</li>
            ))}
          </ul>
        </div>
      </div>

      <button className="btn back-btn" onClick={() => setPage("home")}>
        Back
      </button>
    </div>
  );
}

  return <p>Loading...</p>;
}
  return (
    <div className="app">
      <video className="video-bg" autoPlay loop muted playsInline>
        <source
          src="https://cdn.pixabay.com/video/2022/08/29/129502-744385593_tiny.mp4"
          type="video/mp4"
        />
      </video>

      {renderContent()}

      <a
        href="https://wa.me/919876543210"
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-float"
      >
      Connect with us
      </a>

  <div className="ai-coach">
  <h4>PrepWise Assistant</h4>
  <button className="chat-btn" onClick={() => setShowChat(!showChat)}>
    {showChat ? "Hide" : "Chat"}
  </button>

  {showChat && (
    <iframe
      title="PrepWise Assistant"
      src="https://www.chatbase.co/chatbot-iframe/YOUR_CHATBOT_ID"
      width="100%"
      style={{
        border: "none",
        borderRadius: "8px",
        marginTop: "8px",
      }}
    ></iframe>
  )}
</div>


      <footer className="footer">
        <p>© 2025 PrepWise. All rights reserved.</p>
        <div className="socials">
          <a href="https://github.com/yourusername" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href="https://linkedin.com/in/yourusername" target="_blank" rel="noreferrer">
            LinkedIn
          </a>
          <a href="https://instagram.com/yourusername" target="_blank" rel="noreferrer">
            Instagram
          </a>
        </div>
      </footer>
    </div>
  );
}



export default App;
