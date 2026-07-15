import { Routes, Route } from 'react-router-dom'

function Home() {
  return <div style={{color:'white',padding:'2rem'}}>
    <h1>Dashboard Works!</h1>
    <a href="/login" style={{color:'cyan'}}>Go to Login</a>
  </div>
}

function Login() {
  return <div style={{color:'white',padding:'2rem'}}>
    <h1>Login Works!</h1>
  </div>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  )
}
