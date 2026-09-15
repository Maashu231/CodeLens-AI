from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def home():
    return {"message": "CodeLens AI backend is running"}