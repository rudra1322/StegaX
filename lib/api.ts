const API_URL = process.env.NEXT_PUBLIC_API_URL

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not configured")
}

export async function hideFile(
  coverImage: File,
  secretFile: File
) {
  const formData = new FormData()

  formData.append("cover", coverImage)
  formData.append("secret", secretFile)

  const response = await fetch(`${API_URL}/api/hide`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))

    throw new Error(
      error.error || "Failed to hide file"
    )
  }

  return await response.blob()
}

export async function extractFile(stegoImage: File) {
  const formData = new FormData()

  formData.append("stego", stegoImage)

  const response = await fetch(`${API_URL}/api/extract`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))

    throw new Error(
      error.error || "Failed to extract file"
    )
  }

  return await response.blob()
}

export async function hideText(
  coverImage: File,
  text: string
) {
  const formData = new FormData()

  formData.append("cover", coverImage)
  formData.append("text", text)

  const response = await fetch(`${API_URL}/api/hide-text`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))

    throw new Error(
      error.error || "Failed to hide text"
    )
  }

  return await response.blob()
}

export async function extractText(stegoImage: File) {
  const formData = new FormData()

  formData.append("stego", stegoImage)

  const response = await fetch(`${API_URL}/api/extract-text`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))

    throw new Error(
      error.error || "Failed to extract text"
    )
  }

  return await response.json()
}