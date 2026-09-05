import uvicorn
import os
import sys

if __name__ == "__main__":
    print("✨ Starting Payzor AI Backend on http://127.0.0.1:8000 ...")
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
