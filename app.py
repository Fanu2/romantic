import gradio as gr
import random
from transformers import pipeline

# Load GPT-Neo model
generator = pipeline("text-generation", model="EleutherAI/gpt-neo-125M")

# Word banks
ADJECTIVES = ["gorgeous", "magnificent", "beautiful", "stunning", "amazing", "enchanting"]
NOUNS = ["star", "diamond", "rose", "poem", "melody", "dream"]
VERBS = ["fall", "swoon", "smile", "blush", "gaze", "melt"]
BODY_PARTS = ["heart", "pulse", "knees", "mind"]
MATERIALS = ["gold", "silver", "diamond", "magic"]
EMOTIONS = ["butterflies", "warm", "electric", "tender"]

LOVE_QUOTES = [
    "You are the {adjective} person I've ever met. My heart skips a beat every time I see you.",
    "If you were a {noun}, you'd be a perfect {adjective} {noun}.",
    "I didn't believe in love at first sight until I met you. Now I'm {verb}ing to spend forever with you.",
    "You make my {body_part} race every time you {verb}. Are you {adjective} or is it just me?",
    "Being with you is like being in a {adjective} dream I never want to wake up from.",
    "You're not just special, you're {adjective}. And that's why I can't stop {verb}ing about you.",
    "If love were {noun}, you'd be my endless {noun}.",
    "I'm not {verb}ing, but you're absolutely {adjective}."
]

FLIRT_LINES = [
    "Are you a {noun}? Because you've got me {verb}ing for you.",
    "Do you have a map? I keep getting lost in your {adjective} eyes.",
    "Are you made of {material}? Because you're {adjective} and I'm completely drawn to you.",
    "Is your name {adjective}? Because you're giving me {emotion} feelings.",
    "Do you believe in love at first sight, or should I {verb} past you again?",
    "If you were a vegetable, you'd be a cute {adjective} {noun}.",
    "Are you a camera? Because every time I look at you, I smile.",
    "Is it hot in here or is it just you being {adjective}?"
]

# Template-based generator
def generate_template_content(content_type, custom_adjective="", custom_noun="", custom_verb=""):
    adjective = custom_adjective or random.choice(ADJECTIVES)
    noun = custom_noun or random.choice(NOUNS)
    verb = custom_verb or random.choice(VERBS)
    body_part = random.choice(BODY_PARTS)
    material = random.choice(MATERIALS)
    emotion = random.choice(EMOTIONS)

    template = random.choice(LOVE_QUOTES if content_type == "Love Quote" else FLIRT_LINES)
    return template.format(
        adjective=adjective,
        noun=noun,
        verb=verb,
        body_part=body_part,
        material=material,
        emotion=emotion
    )

# Model-based generator
def generate_model_content(prompt, max_length=60):
    response = generator(prompt, max_length=max_length, do_sample=True, temperature=0.9)
    return response[0]["generated_text"]

# Gradio UI
with gr.Blocks(title="💘 Love & Flirty Content Generator") as app:
    gr.Markdown("## 💘 Love & Flirty Content Generator")
    gr.Markdown("Choose between handcrafted templates or AI-generated romantic messages. Customize your words or let the app surprise you!")

    with gr.Tab("Template Generator"):
        with gr.Row():
            with gr.Column():
                content_type = gr.Radio(["Love Quote", "Flirt Line"], label="Content Type", value="Love Quote")
                custom_adjective = gr.Textbox(label="Custom Adjective", placeholder="e.g., enchanting")
                custom_noun = gr.Textbox(label="Custom Noun", placeholder="e.g., star")
                custom_verb = gr.Textbox(label="Custom Verb", placeholder="e.g., smile")
                generate_btn = gr.Button("Generate Template Message")
            with gr.Column():
                output = gr.Textbox(label="Generated Message", lines=4, interactive=False, show_copy_button=True)

        generate_btn.click(
            fn=generate_template_content,
            inputs=[content_type, custom_adjective, custom_noun, custom_verb],
            outputs=output
        )

    with gr.Tab("AI Generator"):
        with gr.Row():
            with gr.Column():
                prompt_input = gr.Textbox(label="Prompt", placeholder="e.g., Write a romantic message about starlight and butterflies")
                max_length = gr.Slider(30, 100, value=60, label="Max Length")
                model_btn = gr.Button("Generate with GPT")
            with gr.Column():
                model_output = gr.Textbox(label="Generated Text", lines=6, interactive=False, show_copy_button=True)

        model_btn.click(
            fn=generate_model_content,
            inputs=[prompt_input, max_length],
            outputs=model_output
        )

if __name__ == "__main__":
    app.launch()
