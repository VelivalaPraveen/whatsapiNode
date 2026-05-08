const express = require("express");
const body_parser = require("body-parser");
const axios = require("axios");

require("dotenv").config();

const app = express().use(body_parser.json());

const access_token = "EAAXf9ZBpmgnsBRXXyoZBvoKpP7FRDTeeKKcC1fd0OKhYLhrDrnUwmLZAZBT9ZAfZAQUmasyedEX6MtUCS49Ko4DRMSlNJYlNAzoln3SJ0PQ3iyiFBZANZBSC0Ni9MItACTjRVtZAoeCHGAljCCr4ZAxHlB2TZCGV20HXPkQXrFtvxZBq1ZBvTS1ywZCJwQ4WLV8LBfsAZDZD";
const verify_token = "myverifytoken";
const phone_number_id = 1140099032500596;



// ======================================================
// START SERVER
// ======================================================

app.listen(3000||process.env.PORT  , () => {

    console.log("Webhook server started...");
});



// ======================================================
// HOME ROUTE
// ======================================================

app.get("/", (req, res) => {
    res.send("WhatsApp Cloud API Running...");
});



// ======================================================
// WEBHOOK VERIFICATION
// ======================================================

app.get("/webhook", (req, res) => {

    try {

        // GET QUERY PARAMS
        const mode = req.query["hub.mode"];

        const challenge = req.query["hub.challenge"];

        const token = req.query["hub.verify_token"];



        console.log("MODE :", mode);
        console.log("CHALLENGE :", challenge);
        console.log("TOKEN :", token);



        // CHECK PARAMS
        if (!mode || !challenge || !token) {

            return res.status(400).json({
                success: false,
                message: "Missing query parameters",
                required: [
                    "hub.mode",
                    "hub.challenge",
                    "hub.verify_token"
                ]
            });
        }



        // VERIFY TOKEN
        if (
            mode === "subscribe" &&
            token === verify_token
        ) {

            console.log("WEBHOOK VERIFIED SUCCESSFULLY");

            return res.status(200).send(challenge);

        } else {

            console.log("WEBHOOK VERIFICATION FAILED");

            return res.status(403).json({
                success: false,
                message: "Invalid verify token"
            });
        }

    } catch (error) {

        console.log("WEBHOOK ERROR");
        console.log(error);

        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});



// ======================================================
// RECEIVE MESSAGES
// ======================================================

app.post("/webhook", async (req, res) => {

    try {

        const body_param = req.body;

        console.log("========== BODY ==========");
        console.log(JSON.stringify(body_param, null, 2));



        // =========================================
        // TEMPLATE DELIVERY STATUS
        // =========================================

        const statuses =
            body_param?.entry?.[0]
            ?.changes?.[0]
            ?.value?.statuses;

        if (statuses) {

            console.log("========== TEMPLATE STATUS ==========");

            console.log(
                JSON.stringify(statuses, null, 2)
            );
        }



        // BODY VALIDATION
        if (!body_param) {

            return res.status(400).json({
                success: false,
                message: "Body missing"
            });
        }



        // CHECK OBJECT
        if (!body_param.object) {

            return res.status(400).json({
                success: false,
                message: "Invalid WhatsApp payload"
            });
        }



        // CHECK MESSAGE EXISTS
        const message =
            body_param?.entry?.[0]
            ?.changes?.[0]
            ?.value?.messages?.[0];



        if (!message) {

            return res.status(200).json({
                success: true,
                message: "Status webhook received"
            });
        }



        // EXTRACT VALUES
        const from = message.from;

        const msg_body = message.text?.body || "";



        console.log("FROM :", from);
        console.log("MESSAGE :", msg_body);



        // SUCCESS RESPONSE
        return res.status(200).json({
            success: true,
            from: from,
            message: msg_body
        });

    } catch (error) {

        console.log("WEBHOOK ERROR");
        console.log(error);

        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});



// ======================================================
// SEND NORMAL TEXT MESSAGE
// ======================================================

async function sendTextMessage(to, message) {

    try {

        // =========================================
        // PAYLOAD
        // =========================================

        const payload = {

            messaging_product: "whatsapp",

            to: String(to).trim(),

            type: "text",

            text: {
                body: String(message)
            }
        };



        console.log("========== TEXT PAYLOAD ==========");

        console.log(
            JSON.stringify(payload, null, 2)
        );



        // =========================================
        // SEND MESSAGE
        // =========================================

        const response = await axios.post(

            `https://graph.facebook.com/v25.0/${phone_number_id}/messages`,

            payload,

            {
                headers: {

                    Authorization: `Bearer ${access_token}`,

                    "Content-Type": "application/json"
                }
            }
        );



        // =========================================
        // RESPONSE
        // =========================================

        console.log("========== TEXT RESPONSE ==========");

        console.log(
            JSON.stringify(
                response.data,
                null,
                2
            )
        );



        // =========================================
        // MESSAGE DETAILS
        // =========================================

        const message_id =
            response.data?.messages?.[0]?.id;

        const message_status =
            response.data?.messages?.[0]?.message_status;



        console.log("MESSAGE ID :", message_id);

        console.log("MESSAGE STATUS :", message_status);



        // =========================================
        // RETURN
        // =========================================

        return {

            success: true,

            message_id: message_id,

            message_status: message_status,

            data: response.data
        };

    } catch (error) {

        console.log("========== TEXT ERROR ==========");

        if (error.response) {

            console.log(
                JSON.stringify(
                    error.response.data,
                    null,
                    2
                )
            );

        } else {

            console.log(error.message);
        }



        return {

            success: false,

            error:
                error.response?.data ||
                error.message
        };
    }
}



// ======================================================
// SEND TEMPLATE MESSAGE
// ======================================================

// async function sendTemplateMessage(to, template_name, language_code) {

//     try {

//         let response = await axios({

//             method: "POST",

//             url:
//                 "https://graph.facebook.com/v25.0/" +
//                 phone_number_id +
//                 "/messages",

//             headers: {
//                 Authorization: `Bearer ${access_token}`,
//                 "Content-Type": "application/json",
//             },

//             data: {

//                 messaging_product: "whatsapp",

//                 to: to,

//                 type: "template",

//                 template: {

//                     name: template_name,

//                     language: {
//                         code: language_code || "en",
//                     },
//                 },
//             },
//         });

//         return response.data;

//     } catch (error) {

//         console.log(error.response?.data || error.message);

//         throw error;
//     }
// }


async function sendTemplateMessage(
    to,
    template_name,
    language_code
) {

    try {

        // DEFAULT LANGUAGE
        language_code = language_code || "en";



        // PAYLOAD
        const payload = {

            messaging_product: "whatsapp",

            to: String(to).trim(),

            type: "template",

            template: {

                name: String(template_name).trim(),

                language: {
                    code: String(language_code).trim()
                }
            }
        };



        console.log("========== PAYLOAD ==========");
        console.log(JSON.stringify(payload, null, 2));



        // API CALL
        const response = await axios.post(

            `https://graph.facebook.com/v25.0/${phone_number_id}/messages`,

            payload,

            {
                headers: {

                    Authorization: `Bearer ${access_token}`,

                    "Content-Type": "application/json"
                }
            }
        );



        console.log("========== SUCCESS ==========");
        console.log(response.data);



        return response.data;

    } catch (error) {

        console.log("========== ERROR ==========");

        if (error.response) {

            console.log(
                JSON.stringify(
                    error.response.data,
                    null,
                    2
                )
            );

        } else {

            console.log(error.message);
        }

        throw error;
    }
}


// ======================================================
// API TO SEND NORMAL MESSAGE
// ======================================================

app.post("/send-text", async (req, res) => {

    try {

        // GET VALUES FROM REQUEST BODY
        const user_number = req.body.to;

        const message = req.body.message;



        // VALIDATION
        if (!user_number || !message) {

            return res.status(400).json({
                success: false,
                message: "to and message are required"
            });
        }



        // SEND WHATSAPP MESSAGE
        await sendTextMessage(
            user_number,
            message
        );



        // SUCCESS RESPONSE
        res.status(200).json({
            success: true,
            message: "Text Message Sent"
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


// ======================================================
// API TO SEND TEMPLATE MESSAGE
// ======================================================

// app.post("/send-template", async (req, res) => {

//     try {

//         const {
//             user_number,
//             template_name,
//             language_code
//         } = req.body;

//         if (!user_number || !template_name) {

//             return res.status(400).json({
//                 error: "user_number and template_name are required"
//             });
//         }

//         let response = await sendTemplateMessage(
//             user_number,
//             template_name,
//             language_code
//         );

//         res.status(200).json({
//             success: true,
//             data: response
//         });

//     } catch (error) {

//         res.status(500).json({
//             success: false,
//             error: error.response?.data || error.message
//         });
//     }
// });
app.post("/send-template", async (req, res) => {

    try {

        const {
            user_number,
            template_name,
            language_code
        } = req.body;



        const response = await sendTemplateMessage(
            user_number,
            template_name,
            language_code
        );



        res.status(200).json({
            success: true,
            data: response
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            error: error.response?.data || error.message
        });
    }
});