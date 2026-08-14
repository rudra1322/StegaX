"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Upload,
  Download,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  FileText,
  File,
  Sun,
  Moon,
  User,
  LogIn,
  X,
  Terminal,
  Zap,
  ArrowRight,
  Code,
  Cpu,
  Shield,
} from "lucide-react"
import { useTheme } from "next-themes"
import NextImage from 'next/image'

export default function StegaX() {
  const { theme, setTheme } = useTheme()
  const [showLanding, setShowLanding] = useState(true)
  const [activeTab, setActiveTab] = useState<"hide" | "extract">("hide")
  const [showPassword, setShowPassword] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [resultMessage, setResultMessage] = useState("")
  const [resultType, setResultType] = useState<"success" | "error">("success")

  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin")
  const [authEmail, setAuthEmail] = useState("")
  const [authPassword, setAuthPassword] = useState("")
  const [authConfirmPassword, setAuthConfirmPassword] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userEmail, setUserEmail] = useState("")

  // Hide functionality state
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [secretFile, setSecretFile] = useState<File | null>(null)
  const [hideMode, setHideMode] = useState<"file" | "text">("file")
  const [secretText, setSecretText] = useState("")
  const [hidePassword, setHidePassword] = useState("")
  const [stegoImageUrl, setStegoImageUrl] = useState<string | null>(null)

  // Extract functionality state
  const [stegoImage, setStegoImage] = useState<File | null>(null)
  const [extractPassword, setExtractPassword] = useState("")
  const [extractedFile, setExtractedFile] = useState<{ name: string; url: string } | null>(null)
  const [extractedText, setExtractedText] = useState<string | null>(null)

  const coverImageRef = useRef<HTMLInputElement>(null)
  const secretFileRef = useRef<HTMLInputElement>(null)
  const stegoImageRef = useRef<HTMLInputElement>(null)

  // Safe input handlers that accept either an event or a raw value (defensive)
  const setAuthEmailSafe = (eOrValue: React.ChangeEvent<HTMLInputElement> | string) => {
    const value = typeof eOrValue === "string" ? eOrValue : (eOrValue?.target?.value ?? "")
    setAuthEmail(value)
  }

  const setAuthPasswordSafe = (eOrValue: React.ChangeEvent<HTMLInputElement> | string) => {
    const value = typeof eOrValue === "string" ? eOrValue : (eOrValue?.target?.value ?? "")
    setAuthPassword(value)
  }

  const setAuthConfirmPasswordSafe = (eOrValue: React.ChangeEvent<HTMLInputElement> | string) => {
    const value = typeof eOrValue === "string" ? eOrValue : (eOrValue?.target?.value ?? "")
    setAuthConfirmPassword(value)
  }

  const setHidePasswordSafe = (eOrValue: React.ChangeEvent<HTMLInputElement> | string) => {
    const value = typeof eOrValue === "string" ? eOrValue : (eOrValue?.target?.value ?? "")
    setHidePassword(value)
  }

  const setExtractPasswordSafe = (eOrValue: React.ChangeEvent<HTMLInputElement> | string) => {
    const value = typeof eOrValue === "string" ? eOrValue : (eOrValue?.target?.value ?? "")
    setExtractPassword(value)
  }

  const setSecretTextSafe = (eOrValue: React.ChangeEvent<HTMLTextAreaElement> | string) => {
    const value = typeof eOrValue === "string" ? eOrValue : (eOrValue?.target?.value ?? "")
    setSecretText(value)
  }

  const setCoverImageSafe = (e?: React.ChangeEvent<HTMLInputElement>) => {
    const file = e?.target?.files?.[0] ?? null
    setCoverImage(file)
  }

  const setSecretFileSafe = (e?: React.ChangeEvent<HTMLInputElement>) => {
    const file = e?.target?.files?.[0] ?? null
    setSecretFile(file)
  }

  const setStegoImageSafe = (e?: React.ChangeEvent<HTMLInputElement>) => {
    const file = e?.target?.files?.[0] ?? null
    setStegoImage(file)
  }

  // Ensure Dialog onOpenChange gets a boolean, not an event object
  const handleAuthModalOpenChange = (open: boolean) => {
    setShowAuthModal(open)
  }

  const handleExploreNow = () => {
    setShowLanding(false)
  }

  const handleGoogleAuth = () => {
    // Simulate Google OAuth flow
    const mockGoogleUser = {
      email: "user@gmail.com",
      name: "Google User",
    }

    setIsAuthenticated(true)
    setUserEmail(mockGoogleUser.email)
    setShowAuthModal(false)
    setResultMessage("Successfully signed in with Google!")
    setResultType("success")
    setShowResult(true)
  }

  const hideDataInImage = async (coverImg: File, secretData: File | string, password: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new window.Image()

      img.crossOrigin = "anonymous"
      img.onload = async () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx?.drawImage(img, 0, 0)

        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height)
        if (!imageData) {
          reject(new Error("Failed to get image data"))
          return
        }

        let secretBytes: Uint8Array
        let filename: string
        let isText = false

        if (typeof secretData === "string") {
          secretBytes = new TextEncoder().encode(secretData)
          filename = "secret-text.txt"
          isText = true
        } else {
          const secretBuffer = await secretData.arrayBuffer()
          secretBytes = new Uint8Array(secretBuffer)
          filename = secretData.name
        }

        const header = JSON.stringify({
          filename,
          size: secretBytes.length,
          password: password ? btoa(password) : null,
          isText,
        })
        const headerBytes = new TextEncoder().encode(header)
        const headerSize = headerBytes.length

        const totalBits = (headerSize + 4 + secretBytes.length) * 8
        const availableBits = imageData.data.length

        if (totalBits > availableBits) {
          reject(new Error("Payload too big for this image"))
          return
        }

        let bitIndex = 0

        const headerSizeBytes = new Uint32Array([headerSize])
        const headerSizeView = new Uint8Array(headerSizeBytes.buffer)

        for (let i = 0; i < 4; i++) {
          for (let bit = 0; bit < 8; bit++) {
            const pixelIndex = Math.floor(bitIndex / 3) * 4 + (bitIndex % 3)
            const bitValue = (headerSizeView[i] >> bit) & 1
            imageData.data[pixelIndex] = (imageData.data[pixelIndex] & 0xfe) | bitValue
            bitIndex++
          }
        }

        for (let i = 0; i < headerBytes.length; i++) {
          for (let bit = 0; bit < 8; bit++) {
            const pixelIndex = Math.floor(bitIndex / 3) * 4 + (bitIndex % 3)
            const bitValue = (headerBytes[i] >> bit) & 1
            imageData.data[pixelIndex] = (imageData.data[pixelIndex] & 0xfe) | bitValue
            bitIndex++
          }
        }

        for (let i = 0; i < secretBytes.length; i++) {
          for (let bit = 0; bit < 8; bit++) {
            const pixelIndex = Math.floor(bitIndex / 3) * 4 + (bitIndex % 3)
            const bitValue = (secretBytes[i] >> bit) & 1
            imageData.data[pixelIndex] = (imageData.data[pixelIndex] & 0xfe) | bitValue
            bitIndex++
          }
        }

        ctx?.putImageData(imageData, 0, 0)
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            resolve(url)
          } else {
            reject(new Error("Failed to create stego image"))
          }
        }, "image/png")
      }

      img.onerror = () => reject(new Error("Failed to load cover image"))
      img.src = URL.createObjectURL(coverImg)
    })
  }

  const extractDataFromImage = async (
    stegoImg: File,
    password: string,
  ): Promise<{ name: string; url: string; text?: string; isText?: boolean }> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new window.Image()

      img.crossOrigin = "anonymous"
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx?.drawImage(img, 0, 0)

        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height)
        if (!imageData) {
          reject(new Error("Failed to get image data"))
          return
        }

        let bitIndex = 0

        const headerSizeBytes = new Uint8Array(4)
        for (let i = 0; i < 4; i++) {
          let byte = 0
          for (let bit = 0; bit < 8; bit++) {
            const pixelIndex = Math.floor(bitIndex / 3) * 4 + (bitIndex % 3)
            const bitValue = imageData.data[pixelIndex] & 1
            byte |= bitValue << bit
            bitIndex++
          }
          headerSizeBytes[i] = byte
        }

        const headerSize = new Uint32Array(headerSizeBytes.buffer)[0]

        const headerBytes = new Uint8Array(headerSize)
        for (let i = 0; i < headerSize; i++) {
          let byte = 0
          for (let bit = 0; bit < 8; bit++) {
            const pixelIndex = Math.floor(bitIndex / 3) * 4 + (bitIndex % 3)
            const bitValue = imageData.data[pixelIndex] & 1
            byte |= bitValue << bit
            bitIndex++
          }
          headerBytes[i] = byte
        }

        const header = JSON.parse(new TextDecoder().decode(headerBytes))

        if (header.password && (!password || btoa(password) !== header.password)) {
          reject(new Error("Incorrect password"))
          return
        }

        const secretBytes = new Uint8Array(header.size)
        for (let i = 0; i < header.size; i++) {
          let byte = 0
          for (let bit = 0; bit < 8; bit++) {
            const pixelIndex = Math.floor(bitIndex / 3) * 4 + (bitIndex % 3)
            const bitValue = imageData.data[pixelIndex] & 1
            byte |= bitValue << bit
            bitIndex++
          }
          secretBytes[i] = byte
        }

        const blob = new Blob([secretBytes])
        const url = URL.createObjectURL(blob)

        if (header.isText) {
          const text = new TextDecoder().decode(secretBytes)
          resolve({ name: header.filename, url, text, isText: true })
        } else {
          resolve({ name: header.filename, url, isText: false })
        }
      }

      img.onerror = () => reject(new Error("Failed to load stego image"))
      img.src = URL.createObjectURL(stegoImg)
    })
  }

  const handleHideFile = async () => {
    if (!coverImage) {
      setResultMessage("Please select a cover image")
      setResultType("error")
      setShowResult(true)
      return
    }

    if (hideMode === "file" && !secretFile) {
      setResultMessage("Please select a secret file")
      setResultType("error")
      setShowResult(true)
      return
    }

    if (hideMode === "text" && !secretText.trim()) {
      setResultMessage("Please enter some text to hide")
      setResultType("error")
      setShowResult(true)
      return
    }

    setIsProcessing(true)
    try {
      const secretData = hideMode === "file" ? secretFile! : secretText
      const stegoUrl = await hideDataInImage(coverImage, secretData, hidePassword)
      setStegoImageUrl(stegoUrl)
      setResultMessage(`${hideMode === "file" ? "File" : "Text"} successfully hidden in image!`)
      setResultType("success")
      setShowResult(true)
    } catch (error) {
      setResultMessage(error instanceof Error ? error.message : `Failed to hide ${hideMode}`)
      setResultType("error")
      setShowResult(true)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExtractFile = async () => {
    if (!stegoImage) {
      setResultMessage("Please select a stego image")
      setResultType("error")
      setShowResult(true)
      return
    }

    setIsProcessing(true)
    try {
      const extracted = await extractDataFromImage(stegoImage, extractPassword)
      setExtractedFile(extracted)

      if (extracted.isText && extracted.text) {
        setExtractedText(extracted.text)
        setResultMessage("Text successfully extracted!")
      } else {
        setExtractedText(null)
        setResultMessage("File successfully extracted!")
      }

      setResultType("success")
      setShowResult(true)
    } catch (error) {
      setResultMessage(error instanceof Error ? error.message : "Failed to extract data")
      setResultType("error")
      setShowResult(true)
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadFile = (url: string, filename: string) => {
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleAuth = () => {
    if (authMode === "signup") {
      if (authPassword !== authConfirmPassword) {
        setResultMessage("Passwords do not match")
        setResultType("error")
        setShowResult(true)
        return
      }
      if (authPassword.length < 6) {
        setResultMessage("Password must be at least 6 characters")
        setResultType("error")
        setShowResult(true)
        return
      }
    }

    if (!authEmail || !authPassword) {
      setResultMessage("Please fill in all fields")
      setResultType("error")
      setShowResult(true)
      return
    }

    // Simulate authentication
    setIsAuthenticated(true)
    setUserEmail(authEmail)
    setShowAuthModal(false)
    setAuthEmail("")
    setAuthPassword("")
    setAuthConfirmPassword("")
    setResultMessage(`Successfully ${authMode === "signin" ? "signed in" : "signed up"}!`)
    setResultType("success")
    setShowResult(true)
  }

  const handleSignOut = () => {
    setIsAuthenticated(false)
    setUserEmail("")
    setResultMessage("Successfully signed out!")
    setResultType("success")
    setShowResult(true)
  }

  const openAuthModal = (mode: "signin" | "signup") => {
    setAuthMode(mode)
    setShowAuthModal(true)
  }

  const handleResultOpenChange = (open: boolean) => {
    setShowResult(open)
  }

  if (showLanding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 sm:p-6 lg:p-8 relative overflow-hidden flex items-center justify-center">
        {/* Animated background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px] sm:bg-[size:50px_50px] pointer-events-none animate-pulse"></div>

        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400 rounded-full animate-ping opacity-20"></div>
          <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-purple-400 rounded-full animate-ping opacity-30 animation-delay-1000"></div>
          <div className="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-cyan-300 rounded-full animate-ping opacity-25 animation-delay-2000"></div>
        </div>

        {/* Gradient overlay */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>

        <div className="text-center z-10 max-w-2xl mx-auto px-4">
          {/* Logo section */}
          <div className="mb-8 sm:mb-12">
            <div className="relative inline-block mb-4 sm:mb-6">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto">
                <NextImage
                  src="/images/blackark-logo.png"
                  alt="StegaX Logo"
                  width={96}
                  height={96}
                  className="rounded-full drop-shadow-[0_0_30px_rgba(34,211,238,0.8)] animate-pulse"
                />
              </div>

              {/* Orbiting elements */}
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: "8s" }}>
                <Code className="h-3 w-3 sm:h-4 sm:w-4 text-purple-400 absolute -top-2 left-1/2 transform -translate-x-1/2" />
              </div>
              <div
                className="absolute inset-0 animate-spin"
                style={{ animationDuration: "12s", animationDirection: "reverse" }}
              >
                <Cpu className="h-3 w-3 sm:h-4 sm:w-4 text-cyan-400 absolute -bottom-2 left-1/2 transform -translate-x-1/2" />
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-2xl mb-2 sm:mb-4 animate-pulse">
              StegaX
            </h1>

            <div className="relative">
              <p className="text-lg sm:text-xl lg:text-2xl text-cyan-200/90 font-medium mb-1 sm:mb-2 font-mono">
                Advanced Steganography Platform
              </p>
              <p className="text-base sm:text-lg text-purple-200/70 font-mono">Hide • Extract • Secure</p>

              {/* Glowing underline */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 sm:w-32 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8 sm:mb-12 space-y-2 sm:space-y-4">
            <p className="text-lg sm:text-xl text-cyan-100/80 leading-relaxed font-mono px-2">
              Enter the digital underground where secrets hide in plain sight
            </p>
            <p className="text-sm sm:text-lg text-purple-200/70 leading-relaxed px-2">
              Military-grade steganography • Zero-trace encryption • Quantum-resistant security
            </p>
          </div>

          {/* Explore button */}
          <Button
            onClick={handleExploreNow}
            size="lg"
            className="group relative px-8 sm:px-12 py-4 sm:py-6 text-lg sm:text-xl font-bold bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 hover:from-cyan-400 hover:via-purple-400 hover:to-cyan-400 text-white shadow-2xl shadow-cyan-500/30 transition-all duration-500 hover:scale-110 hover:shadow-3xl hover:shadow-cyan-400/40 border-0 rounded-xl overflow-hidden"
          >
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-purple-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            {/* Button content */}
            <div className="relative flex items-center gap-2 sm:gap-3">
              <Terminal className="h-5 w-5 sm:h-6 sm:w-6 group-hover:animate-pulse" />
              <span>Explore Now</span>
              <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 group-hover:translate-x-1 transition-transform duration-300" />
            </div>

            {/* Glowing border effect */}
            <div className="absolute inset-0 rounded-xl border-2 border-cyan-400/50 group-hover:border-cyan-300 transition-colors duration-300"></div>
          </Button>

          {/* Security badges */}
          <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-cyan-200/60 font-mono">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>AES-256 Encrypted</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              <span>Zero Logs</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <span>Open Source</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px] sm:bg-[size:50px_50px] pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="relative w-6 h-6 sm:w-8 sm:h-8">
              <NextImage
                src="/images/blackark-logo.png"
                alt="StegaX Logo"
                width={32}
                height={32}
                className="rounded-full drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]"
              />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">
                StegaX
              </h1>
              <p className="text-cyan-200/80 text-sm sm:text-base lg:text-lg font-medium">
                Securely hide and extract files using steganography
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              className="border-cyan-500/30 bg-slate-800/50 hover:bg-cyan-500/10 hover:border-cyan-400 text-cyan-300 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-cyan-400/25 flex-shrink-0"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {isAuthenticated ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm text-cyan-200/70 font-mono hidden sm:inline">
                  Welcome, {userEmail}
                </span>
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="gap-2 border-purple-500/30 bg-slate-800/50 hover:bg-purple-500/10 hover:border-purple-400 text-purple-300 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-400/25 text-xs sm:text-sm"
                >
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="gap-2 border-purple-500/30 bg-slate-800/50 hover:bg-purple-500/10 hover:border-purple-400 text-purple-300 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-400/25 text-xs sm:text-sm px-2 sm:px-4"
                  onClick={() => openAuthModal("signup")}
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Up</span>
                </Button>

                <Button
                  className="gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-cyan-400/30 text-xs sm:text-sm px-2 sm:px-4"
                  onClick={() => openAuthModal("signin")}
                >
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="bg-slate-800/60 backdrop-blur-sm p-1 rounded-lg border border-cyan-500/20 shadow-lg shadow-cyan-500/10 w-full sm:w-auto">
            <div className="flex w-full sm:w-auto">
              <Button
                variant={activeTab === "hide" ? "default" : "ghost"}
                onClick={() => setActiveTab("hide")}
                className={`flex-1 sm:flex-none px-3 sm:px-6 text-xs sm:text-sm transition-all duration-300 hover:scale-105 ${
                  activeTab === "hide"
                    ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-400/30"
                    : "text-cyan-300 hover:bg-cyan-500/10 hover:text-cyan-200 hover:shadow-lg hover:shadow-cyan-400/20"
                }`}
              >
                <Lock className="h-4 w-4 mr-1 sm:mr-2" />
                Hide File
              </Button>
              <Button
                variant={activeTab === "extract" ? "default" : "ghost"}
                onClick={() => setActiveTab("extract")}
                className={`flex-1 sm:flex-none px-3 sm:px-6 text-xs sm:text-sm transition-all duration-300 hover:scale-105 ${
                  activeTab === "extract"
                    ? "bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-400/30"
                    : "text-purple-300 hover:bg-purple-500/10 hover:text-purple-200 hover:shadow-lg hover:shadow-purple-400/20"
                }`}
              >
                <Unlock className="h-4 w-4 mr-1 sm:mr-2" />
                Extract File
              </Button>
            </div>
          </div>
        </div>

        {activeTab === "hide" && (
          <Card className="bg-slate-800/60 backdrop-blur-sm border-cyan-500/20 shadow-xl shadow-cyan-500/10">
            <CardHeader className="border-b border-cyan-500/20 p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-cyan-300 text-lg sm:text-xl">
                <div className="relative">
                  <Lock className="h-5 w-5" />
                  <div className="absolute inset-0 animate-pulse">
                    <Lock className="h-5 w-5 text-cyan-300/30" />
                  </div>
                </div>
                Hide Secret Data
              </CardTitle>
              <CardDescription className="text-cyan-200/70 text-sm sm:text-base">
                Upload a cover image and hide either a file or text message using steganography
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-cyan-300">Cover window.Image(PNG)</label>

                <div className="border-2 border-dashed border-cyan-500/30 rounded-lg p-4 sm:p-6 text-center bg-slate-900/30 hover:border-cyan-400/50 transition-colors">
                  <div className="relative">
                    <Upload className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-cyan-400" />
                    <div className="absolute inset-0 animate-pulse">
                      <Upload className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-cyan-400/20" />
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-cyan-200/70 mb-2 font-mono break-all">
                    {coverImage ? coverImage.name : "Click to select cover image"}
                  </p>
                  <Input
                    ref={coverImageRef}
                    type="file"
                    accept="image/png"
                    onChange={(e) => setCoverImageSafe(e)}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => coverImageRef.current?.click()}
                    className="border-cyan-500/30 bg-slate-800/50 hover:bg-cyan-500/10 hover:border-cyan-400 text-cyan-300 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-400/25 text-xs sm:text-sm"
                  >
                    <Terminal className="h-4 w-4 mr-1 sm:mr-2" />
                    Select Image
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-cyan-300">What to Hide</label>

                <div className="flex gap-2">
                  <Button
                    variant={hideMode === "file" ? "default" : "outline"}
                    onClick={() => setHideMode("file")}
                    className={`flex-1 transition-all duration-300 hover:scale-105 text-xs sm:text-sm ${
                      hideMode === "file"
                        ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-400/30"
                        : "border-cyan-500/30 bg-slate-800/50 hover:bg-cyan-500/10 hover:border-cyan-400 text-cyan-300 hover:shadow-lg hover:shadow-cyan-400/25"
                    }`}
                  >
                    <File className="h-4 w-4 mr-1 sm:mr-2" />
                    File
                  </Button>
                  <Button
                    variant={hideMode === "text" ? "default" : "outline"}
                    onClick={() => setHideMode("text")}
                    className={`flex-1 transition-all duration-300 hover:scale-105 text-xs sm:text-sm ${
                      hideMode === "text"
                        ? "bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-400/30"
                        : "border-purple-500/30 bg-slate-800/50 hover:bg-purple-500/10 hover:border-purple-400 text-purple-300 hover:shadow-lg hover:shadow-purple-400/25"
                    }`}
                  >
                    <FileText className="h-4 w-4 mr-1 sm:mr-2" />
                    Text
                  </Button>
                </div>
              </div>

              {hideMode === "file" ? (
                <div>
                  <label className="block text-sm font-medium mb-2 text-cyan-300">Secret File</label>
                  <div className="border-2 border-dashed border-purple-500/30 rounded-lg p-4 sm:p-6 text-center bg-slate-900/30 hover:border-purple-400/50 transition-colors">
                    <div className="relative">
                      <Upload className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-purple-400" />
                      <div className="absolute inset-0 animate-pulse">
                        <Upload className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-purple-400/20" />
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-purple-200/70 mb-2 font-mono break-all">
                      {secretFile ? secretFile.name : "Click to select secret file"}
                    </p>
                    <Input ref={secretFileRef} type="file" onChange={(e) => setSecretFileSafe(e)} className="hidden" />
                    <Button
                      variant="outline"
                      onClick={() => secretFileRef.current?.click()}
                      className="border-purple-500/30 bg-slate-800/50 hover:bg-purple-500/10 hover:border-purple-400 text-purple-300 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-400/25 text-xs sm:text-sm"
                    >
                      <Terminal className="h-4 w-4 mr-1 sm:mr-2" />
                      Select File
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-2 text-purple-300">Secret Text</label>

                  <textarea
                    value={secretText}
                    onChange={(e) => setSecretTextSafe(e)}
                    placeholder="Enter your secret message here..."
                    className="w-full min-h-[100px] sm:min-h-[120px] p-3 border border-purple-500/30 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 bg-slate-900/50 text-purple-100 placeholder-purple-300/50 font-mono backdrop-blur-sm text-sm"
                  />
                  <p className="text-xs text-purple-200/60 mt-1 font-mono">{secretText.length} characters</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2 text-cyan-300">Password (Optional)</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={hidePassword}
                    onChange={(e) => setHidePasswordSafe(e)}
                    placeholder="Enter password to protect your data"
                    className="bg-slate-900/50 border-cyan-500/30 text-cyan-100 placeholder-cyan-300/50 focus:border-cyan-400 focus:ring-cyan-400 font-mono backdrop-blur-sm text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all duration-300 hover:scale-110"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleHideFile}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white shadow-lg shadow-cyan-500/25 font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-cyan-400/30 text-sm sm:text-base"
                size="lg"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Hide {hideMode === "file" ? "File" : "Text"} in Image
                  </div>
                )}
              </Button>

              {stegoImageUrl && (
                <div className="bg-gradient-to-r from-green-900/30 to-cyan-900/30 p-4 rounded-lg border border-green-500/30 backdrop-blur-sm">
                  <p className="text-sm font-medium mb-2 text-green-300 font-mono">Stego image ready for download:</p>
                  <Button
                    onClick={() => downloadFile(stegoImageUrl, "stego-image.png")}
                    className="w-full bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-400 hover:to-cyan-400 text-white shadow-lg shadow-green-500/25 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-green-400/30 text-sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Stego Image
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "extract" && (
          <Card className="bg-slate-800/60 backdrop-blur-sm border-purple-500/20 shadow-xl shadow-purple-500/10">
            <CardHeader className="border-b border-purple-500/20 p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-purple-300 text-lg sm:text-xl">
                <div className="relative">
                  <Unlock className="h-5 w-5" />
                  <div className="absolute inset-0 animate-pulse">
                    <Unlock className="h-5 w-5 text-purple-300/30" />
                  </div>
                </div>
                Extract Secret Data
              </CardTitle>
              <CardDescription className="text-purple-200/70 text-sm sm:text-base">
                Upload a stego image to extract the hidden file or text
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-purple-300">Stego Image</label>
                <div className="border-2 border-dashed border-purple-500/30 rounded-lg p-4 sm:p-6 text-center bg-slate-900/30 hover:border-purple-400/50 transition-colors">
                  <div className="relative">
                    <Upload className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-purple-400" />
                    <div className="absolute inset-0 animate-pulse">
                      <Upload className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-purple-400/20" />
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-purple-200/70 mb-2 font-mono break-all">
                    {stegoImage ? stegoImage.name : "Click to select stego image"}
                  </p>
                  <Input
                    ref={stegoImageRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => setStegoImageSafe(e)}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => stegoImageRef.current?.click()}
                    className="border-purple-500/30 bg-slate-800/50 hover:bg-purple-500/10 hover:border-purple-400 text-purple-300 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-400/25 text-xs sm:text-sm"
                  >
                    <Terminal className="h-4 w-4 mr-1 sm:mr-2" />
                    Select Image
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-purple-300">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={extractPassword}
                    onChange={(e) => setExtractPasswordSafe(e)}
                    placeholder="Enter password if data was protected"
                    className="bg-slate-900/50 border-purple-500/30 text-purple-100 placeholder-purple-300/50 focus:border-purple-400 focus:ring-purple-400 font-mono backdrop-blur-sm text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-all duration-300 hover:scale-110"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleExtractFile}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-white shadow-lg shadow-purple-500/25 font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-400/30 text-sm sm:text-base"
                size="lg"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Extract Hidden Data
                  </div>
                )}
              </Button>

              {extractedFile && (
                <div className="bg-gradient-to-r from-green-900/30 to-purple-900/30 p-4 rounded-lg border border-green-500/30 backdrop-blur-sm">
                  {extractedText ? (
                    <div>
                      <p className="text-sm font-medium mb-2 text-green-300 font-mono">Extracted text:</p>
                      <div className="bg-slate-900/70 p-3 rounded border border-green-500/20 max-h-32 sm:max-h-40 overflow-y-auto backdrop-blur-sm">
                        <pre className="whitespace-pre-wrap text-xs sm:text-sm text-green-200 font-mono">
                          {extractedText}
                        </pre>
                      </div>
                      <Button
                        onClick={() => downloadFile(extractedFile.url, extractedFile.name)}
                        className="w-full mt-2 bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-400 hover:to-cyan-400 text-white shadow-lg shadow-green-500/25 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-green-400/30 text-sm"
                        variant="outline"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download as Text File
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium mb-2 text-green-300 font-mono">
                        Extracted file ready for download:
                      </p>
                      <Button
                        onClick={() => downloadFile(extractedFile.url, extractedFile.name)}
                        className="w-full bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-400 hover:to-cyan-400 text-white shadow-lg shadow-green-500/25 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-green-400/30 text-sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download {extractedFile.name}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Dialog open={showAuthModal} onOpenChange={handleAuthModalOpenChange}>
          <DialogContent className="sm:max-w-md mx-4 bg-slate-800/90 backdrop-blur-sm border-cyan-500/20 shadow-xl shadow-cyan-500/10">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-cyan-300 text-lg sm:text-xl">
                  {authMode === "signin" ? "Sign In" : "Sign Up"}
                </DialogTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAuthModal(false)}
                  className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all duration-300 hover:scale-110"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <DialogDescription className="text-cyan-200/70 text-sm">
                {authMode === "signin"
                  ? "Enter your credentials to access your account"
                  : "Create a new account to get started"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Button
                onClick={handleGoogleAuth}
                variant="outline"
                className="w-full border-slate-600 bg-white hover:bg-gray-50 text-gray-900 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl text-sm flex items-center justify-center gap-3"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-cyan-500/20" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-800 px-2 text-cyan-300/70">Or continue with email</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-cyan-300">Email</label>
                <Input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmailSafe(e)}
                  placeholder="Enter your email"
                  className="bg-slate-900/50 border-cyan-500/30 text-cyan-100 placeholder-cyan-300/50 focus:border-cyan-400 focus:ring-cyan-400 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-cyan-300">Password</label>
                <Input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPasswordSafe(e)}
                  placeholder="Enter your password"
                  className="bg-slate-900/50 border-cyan-500/30 text-cyan-100 placeholder-cyan-300/50 focus:border-cyan-400 focus:ring-cyan-400 font-mono text-sm"
                />
              </div>

              {authMode === "signup" && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-cyan-300">Confirm Password</label>
                  <Input
                    type="password"
                    value={authConfirmPassword}
                    onChange={(e) => setAuthConfirmPasswordSafe(e)}
                    placeholder="Confirm your password"
                    className="bg-slate-900/50 border-cyan-500/30 text-cyan-100 placeholder-cyan-300/50 focus:border-cyan-400 focus:ring-cyan-400 font-mono text-sm"
                  />
                </div>
              )}

              <Button
                onClick={handleAuth}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-cyan-400/30 text-sm"
              >
                {authMode === "signin" ? "Sign In" : "Sign Up"}
              </Button>

              <div className="text-center">
                <Button
                  variant="link"
                  onClick={() => setAuthMode(authMode === "signin" ? "signup" : "signin")}
                  className="text-xs sm:text-sm text-cyan-300 hover:text-cyan-200 transition-all duration-300 hover:scale-105"
                >
                  {authMode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showResult} onOpenChange={handleResultOpenChange}>
          <DialogContent className="mx-4 bg-slate-800/90 backdrop-blur-sm border-cyan-500/20 shadow-xl shadow-cyan-500/10">
            <DialogHeader>
              <DialogTitle className={resultType === "success" ? "text-green-400" : "text-red-400"}>
                {resultType === "success" ? "Success!" : "Error"}
              </DialogTitle>
              <DialogDescription className="text-cyan-200/70 font-mono text-sm">{resultMessage}</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        <footer className="mt-16 border-t border-cyan-500/20 bg-slate-800/30 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Brand Section */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative w-8 h-8">
                    <NextImage
                      src="/images/blackark-logo.png"
                      alt="StegaX Logo"
                      width={32}
                      height={32}
                      className="rounded-full drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                    />
                  </div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    StegaX
                  </h3>
                </div>
                <p className="text-cyan-200/70 text-sm leading-relaxed mb-4 font-mono">
                  Advanced steganography platform for secure data hiding and extraction. Protect your sensitive
                  information with military-grade encryption.
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-xs text-green-400 font-mono">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    SECURE
                  </div>
                  <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                    ENCRYPTED
                  </div>
                  <div className="flex items-center gap-2 text-xs text-purple-400 font-mono">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    ANONYMOUS
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="text-cyan-300 font-semibold mb-4 text-sm uppercase tracking-wider">Quick Access</h4>
                <ul className="space-y-2">
                  <li>
                    <button
                      onClick={() => setActiveTab("hide")}
                      className="text-cyan-200/70 hover:text-cyan-300 text-sm font-mono transition-all duration-300 hover:translate-x-1 hover:text-shadow-sm"
                    >
                      → Hide Data
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveTab("extract")}
                      className="text-purple-200/70 hover:text-purple-300 text-sm font-mono transition-all duration-300 hover:translate-x-1"
                    >
                      → Extract Data
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => openAuthModal("signin")}
                      className="text-cyan-200/70 hover:text-cyan-300 text-sm font-mono transition-all duration-300 hover:translate-x-1"
                    >
                      → Sign In
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => openAuthModal("signup")}
                      className="text-purple-200/70 hover:text-purple-300 text-sm font-mono transition-all duration-300 hover:translate-x-1"
                    >
                      → Create Account
                    </button>
                  </li>
                </ul>
              </div>

              {/* Security Info */}
              <div>
                <h4 className="text-purple-300 font-semibold mb-4 text-sm uppercase tracking-wider">Security</h4>
                <ul className="space-y-2 text-sm font-mono">
                  <li className="flex items-center gap-2 text-green-400/80">
                    <Shield className="h-3 w-3" />
                    AES-256 Encryption
                  </li>
                  <li className="flex items-center gap-2 text-cyan-400/80">
                    <Lock className="h-3 w-3" />
                    Zero-Knowledge
                  </li>
                  <li className="flex items-center gap-2 text-purple-400/80">
                    <Eye className="h-3 w-3" />
                    Client-Side Processing
                  </li>
                  <li className="flex items-center gap-2 text-green-400/80">
                    <Zap className="h-3 w-3" />
                    LSB Steganography
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="mt-8 pt-6 border-t border-cyan-500/10">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-xs text-cyan-200/50 font-mono">
                  © 2024 StegaX. All rights reserved. | Built with Next.js & Advanced Cryptography
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-xs text-purple-200/50 font-mono">
                    v2.1.0 | Status:
                    <span className="text-green-400 ml-1">OPERATIONAL</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                    <div
                      className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="w-1 h-1 bg-purple-400 rounded-full animate-pulse"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
