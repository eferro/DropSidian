import { useEffect, useState } from 'react'
import { getCurrentAccount, DropboxAccount } from '../lib/dropbox-client'
import { useAuth } from '../context/AuthContext'

function AccountInfo() {
  const { accessToken } = useAuth()
  const [account, setAccount] = useState<DropboxAccount | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!accessToken) {
      setLoading(false)
      return
    }

    getCurrentAccount(accessToken)
      .then((data) => {
        setAccount(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [accessToken])

  if (loading) {
    return <p>Loading account info...</p>
  }

  if (error) {
    return <p>Error: {error}</p>
  }

  if (!account) {
    return null
  }

  return (
    <div>
      <p>
        <strong>{account.name.display_name}</strong>
      </p>
      <p>{account.email}</p>
    </div>
  )
}

export default AccountInfo


