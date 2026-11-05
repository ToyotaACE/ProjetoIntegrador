"use client"

import Image from "next/image"
import { useEffect, useState } from "react"


import Estrutura from "../componentes/Estrutura"
import MeuCard from "@/app/componentes/ui/MeuCard"

import Yaris from "@/app/assets/image/image/yaris.png"

export default function Financiamento(){

    const [dadosBackend, setDadosBackend] = useState({})
    
    const botaoClicado = ()=>{
        alert("botão clicado")
    }

    useEffect(()=>{ // atalho

        /* const requisicao = async ()=>{
            await fetch('localhost:8080/carros').then((res)=>{
                res.json()
            }).then((json:any)=>{
                if(json.body.usuario != null ){
                    router.push('homepage')
                }
            })
        }

        requisicao 

        //aqui é o que eu quero fazer quando uma ação acontecer
        /*
        Login:
        1- voce digita suas credenciais (email e senha)
        2- clicou em enviar (aqui o useEffect ativa)
        3- Enviar as informações para o backend E AGUARDAR A RESPOSTA
        4- Recebe a resposta e analisa (200:ok / 404:notFound / 501:internalError)
        5- Armazenar o usuário válido no frontend
        6- Se for válido, redireciona para home logada
        */
    },[])

    


    return(
        <Estrutura>
            <MeuCard
            tamanho="xl">
                <div>
                    <Image
                    src={Yaris}
                    width={100}
                    height={100}
                    alt="yaris"
                    />
                </div>
                
            </MeuCard>
        </Estrutura>
    )
}