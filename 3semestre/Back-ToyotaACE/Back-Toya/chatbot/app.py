from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

respostas = {
    "garantia": "A garantia cobre defeitos de fabricação.",
    "financeiro": "Pagamentos podem levar até 48h úteis.",
    "revisão": "As revisões devem ocorrer a cada 10.000 km.",
    "seguro": "Recomendamos contratar seguro antes da retirada.",
    "retirada": "A retirada do veículo deve ser agendada.",
    "pintura": "A pintura protege e dá acabamento ao veículo.",
    "montagem": "A montagem integra todos os componentes do carro.",
    "pagamento": "pix ou boleto",
    "pix": "24h para o recebimento",
    "boleto": "48h para o recebimento",
}

respostas_por_idioma = {
    "en-US": {
        "A garantia cobre defeitos de fabricação.": "The warranty covers manufacturing defects.",
        "Pagamentos podem levar até 48h úteis.": "Payments may take up to 48 business hours.",
        "As revisões devem ocorrer a cada 10.000 km.": "Service inspections should be performed every 10,000 km.",
        "Recomendamos contratar seguro antes da retirada.": "We recommend getting insurance before pickup.",
        "A retirada do veículo deve ser agendada.": "Vehicle pickup must be scheduled.",
        "A pintura protege e dá acabamento ao veículo.": "The paint protects and finishes the vehicle.",
        "A montagem integra todos os componentes do carro.": "Assembly brings all vehicle components together.",
        "pix ou boleto": "PIX or bank slip",
        "24h para o recebimento": "24 hours to receive the payment",
        "48h para o recebimento": "48 hours to receive the payment",
        "Não entendi sua pergunta.": "I could not understand your question.",
    },
    "es-ES": {
        "A garantia cobre defeitos de fabricação.": "La garantía cubre defectos de fabricación.",
        "Pagamentos podem levar até 48h úteis.": "Los pagos pueden tardar hasta 48 horas hábiles.",
        "As revisões devem ocorrer a cada 10.000 km.": "Las revisiones deben realizarse cada 10.000 km.",
        "Recomendamos contratar seguro antes da retirada.": "Recomendamos contratar un seguro antes de retirar el vehículo.",
        "A retirada do veículo deve ser agendada.": "La recogida del vehículo debe reservarse.",
        "A pintura protege e dá acabamento ao veículo.": "La pintura protege y da el acabado al vehículo.",
        "A montagem integra todos os componentes do carro.": "El montaje integra todos los componentes del vehículo.",
        "pix ou boleto": "PIX o recibo bancario",
        "24h para o recebimento": "24 horas para recibir el pago",
        "48h para o recebimento": "48 horas para recibir el pago",
        "Não entendi sua pergunta.": "No entendí tu pregunta.",
    },
    "ja-JP": {
        "A garantia cobre defeitos de fabricação.": "保証は製造上の不具合を対象とします。",
        "Pagamentos podem levar até 48h úteis.": "お支払いの反映には最大48営業時間かかる場合があります。",
        "As revisões devem ocorrer a cada 10.000 km.": "点検は10,000 kmごとに受けてください。",
        "Recomendamos contratar seguro antes da retirada.": "お車の受け取り前に保険へ加入することをおすすめします。",
        "A retirada do veículo deve ser agendada.": "車両の受け取りには予約が必要です。",
        "A pintura protege e dá acabamento ao veículo.": "塗装は車両を保護し、美しい仕上がりを与えます。",
        "A montagem integra todos os componentes do carro.": "組み立て工程で車両の各部品を統合します。",
        "pix ou boleto": "PIXまたは銀行振込",
        "24h para o recebimento": "入金確認まで24時間",
        "48h para o recebimento": "入金確認まで48時間",
        "Não entendi sua pergunta.": "ご質問を理解できませんでした。",
    },
}

termos_equivalentes = {
    "garantia": ["warranty", "garantía", "保証"],
    "financeiro": ["financial", "financing", "financiación", "ローン"],
    "revisão": ["service", "maintenance", "revisión", "点検"],
    "seguro": ["insurance", "seguro", "保険"],
    "retirada": ["pickup", "recogida", "受け取り"],
    "pintura": ["paint", "pintura", "塗装"],
    "montagem": ["assembly", "montaje", "組み立て"],
    "pagamento": ["payment", "pago", "お支払い"],
    "pix": ["pix"],
    "boleto": ["bank slip", "recibo bancario", "銀行振込"],
}

@app.route("/")
def home():
    return "Chatbot Toyota rodando!"

@app.route("/chat", methods=["POST"])
def chat():

    data = request.get_json()

    mensagem = data.get("mensagem", "").lower()
    idioma = data.get("idioma", "pt-BR")

    for palavra, resposta in respostas.items():
        termos = [palavra, *termos_equivalentes.get(palavra, [])]
        if any(termo in mensagem for termo in termos):
            return jsonify({
                "resposta": respostas_por_idioma.get(idioma, {}).get(resposta, resposta)
            })

    return jsonify({
        "resposta": respostas_por_idioma.get(idioma, {}).get(
            "Não entendi sua pergunta.", "Não entendi sua pergunta."
        )
    })

if __name__ == "__main__":
    app.run(debug=True, port=5000)