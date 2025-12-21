import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <main>
      <h1>404 — Page Not Found</h1>
      <p>
        <Link to="/">Go back home</Link>
      </p>
    </main>
  )
}

export default NotFound

