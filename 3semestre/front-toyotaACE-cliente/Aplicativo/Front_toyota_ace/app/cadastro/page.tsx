"use client"

import { useState, type ChangeEvent, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../src/contexts/AuthContext"

const Logo = "/src/assets/logoT.png"

export default function Cadastro() {

  const navigate = useNavigate()
  const { register } = useAuth()

  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    email: "",
    senha: ""
  })

  const [carregando, setCarregando] = useState(false)
  const [erroCpf, setErroCpf] = useState("")
  const [erroSenha, setErroSenha] = useState("")

  const senhaForte = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/

  const atualizaInput = (
    e: ChangeEvent<HTMLInputElement>,
    campo: string
  ) => {
    if (campo === "cpf") {
      const cpf = e.target.value.replace(/\D/g, "")

      setFormData((dados) => ({ ...dados, cpf: cpf.slice(0, 11) }))
      setErroCpf(cpf.length > 11 ? "O CPF deve conter exatamente 11 números." : "")
      return
    }

    if (campo === "senha") {
      const senha = e.target.value

      setFormData((dados) => ({ ...dados, senha }))
      setErroSenha(
        senha.length > 0 && !senhaForte.test(senha)
          ? "Use 8 ou mais caracteres, com maiúscula, minúscula, número e símbolo."
          : ""
      )
      return
    }

    setFormData({
      ...formData,
      [campo]: e.target.value
    })
  }

  const cadastrar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // =========================
    // VALIDAÇÃO DOS CAMPOS
    // =========================

    if (
      formData.nome.trim() === "" ||
      formData.cpf.trim() === "" ||
      formData.email.trim() === "" ||
      formData.senha === ""
    ) {
      alert("Preencha todos os campos")
      return
    }

    // =========================
    // VALIDAÇÃO DO CPF
    // Somente números e exatamente 11
    // =========================

    const cpf = formData.cpf.trim()

    if (!/^\d{11}$/.test(cpf)) {
      setErroCpf("O CPF deve conter exatamente 11 números.")
      alert("CPF inválido. Digite exatamente 11 números, sem pontos ou traços.")
      return
    }

    // =========================
    // VALIDAÇÃO DO E-MAIL
    // =========================

    const email = formData.email.trim()

    if (!/^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$/.test(email)) {
      alert("Digite um e-mail válido.")
      return
    }

    // =========================
    // VALIDAÇÃO DA SENHA
    // Mínimo 8 caracteres
    // 1 minúscula
    // 1 maiúscula
    // 1 número
    // 1 caractere especial
    // =========================

    if (!senhaForte.test(formData.senha)) {
      setErroSenha("Use 8 ou mais caracteres, com maiúscula, minúscula, número e símbolo.")
      alert(
        "A senha deve ter no mínimo 8 caracteres, contendo pelo menos uma letra maiúscula, uma letra minúscula, um número e um caractere especial."
      )
      return
    }

    // =========================
    // ENVIO PARA O BACKEND
    // =========================

    try {

      setCarregando(true)

      await register({
        nome: formData.nome.trim(),
        cpf,
        email,
        senha: formData.senha
      })

      alert("Cadastro realizado com sucesso!")
      navigate("/dashboard", { replace: true })

    } catch (erro) {

      console.error("Erro ao realizar cadastro:", erro)

      alert(erro instanceof Error ? erro.message : "Não foi possível realizar o cadastro.")

    } finally {

      setCarregando(false)

    }
  }

  return (

    <div
      className="w-full min-h-screen bg-[url('https://mir-s3-cdn-cf.behance.net/project_modules/fs/c84ab249239255.56085275bc31a.png')] bg-center bg-cover flex flex-col items-center justify-center p-4"
    >

      <h1 className="text-white text-4xl font-bold mb-6 flex items-center gap-3">

        <img
          src={Logo}
          alt="Logo"
          className="w-10 h-10"
        />

        TOYOTA ACE

      </h1>

      <div className="bg-white/55 backdrop-blur-[10px] w-full max-w-xl rounded-3xl shadow-md p-8 border border-white/20">

        <h1 className="text-2xl font-semibold text-black mb-2">
          Cadastro
        </h1>

        <p className="text-sm text-black mb-6">
          Preencha os dados abaixo para criar sua conta.
        </p>

        <form onSubmit={cadastrar}>

        {/* Nome */}

        <div className="mb-4">

          <label className="block text-sm font-medium mb-1 text-black">
            Nome completo
          </label>

          <input
            type="text"
            placeholder="Digite seu nome"
            value={formData.nome}
            onChange={(e) => atualizaInput(e, "nome")}
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
          />

        </div>

        {/* CPF */}

        <div className="mb-4">

          <label className="block text-sm font-medium mb-1 text-black">
            CPF
          </label>

          <input
            type="text"
            placeholder="Digite seu CPF"
            inputMode="numeric"
            maxLength={11}
            value={formData.cpf}
            onChange={(e) => atualizaInput(e, "cpf")}
            aria-invalid={Boolean(erroCpf)}
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
          />

          {erroCpf && <p className="text-xs text-red-700 mt-1">{erroCpf}</p>}

        </div>

        {/* E-mail */}

        <div className="mb-4">

          <label className="block text-sm font-medium mb-1 text-black">
            E-mail
          </label>

          <input
            type="email"
            placeholder="Digite seu e-mail"
            value={formData.email}
            onChange={(e) => atualizaInput(e, "email")}
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
          />

        </div>

        {/* Senha */}

        <div className="mb-4">

          <label className="block text-sm font-medium mb-1 text-black">
            Senha
          </label>

          <input
            type="password"
            placeholder="Digite sua senha"
            value={formData.senha}
            onChange={(e) => atualizaInput(e, "senha")}
            aria-invalid={Boolean(erroSenha)}
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
          />

          <p className={`text-xs mt-1 ${erroSenha ? "text-red-700" : "text-black"}`}>
            Mínimo de 8 caracteres, com maiúscula, minúscula, número e caractere especial.
          </p>

        </div>

        {/* Botão */}

        <button
          type="submit"
          disabled={carregando}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-500 text-white py-2 rounded-md text-sm font-medium transition"
        >

          {carregando ? "Cadastrando..." : "Cadastrar"}

        </button>
        </form>

      </div>

    </div>
  )
}