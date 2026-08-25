import random
from typing import  Optional
from fastapi import FastAPI, HTTPException,  Header , Depends , status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import timedelta,datetime,timezone
from jose import JWTError,jwt
from passlib.context import CryptContext
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager
from pymongo import MongoClient
import uvicorn
from models import AnalyzeRequest
from auth import verify_password, create_access_token 


SECRET_KEY = "d4f3a9b2c1e68547f9a2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8091a2b3c4d5e"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30



MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "Prepwise"


class AnalyzeRequest(BaseModel):
    age: int
    height: float
    weight: float
    dietType: str
    caste: Optional[str] = ""
    diseases: Optional[str] = ""

class Token(BaseModel):
    access_token: str
    token_type:str

class TokenData(BaseModel):
    username: str | None


class User(BaseModel):
    username: str
    email: str
    full_name: str | None = None
    disabled: bool = False

class UserInDB(User):
    hashed_password: str

class UserSignup(BaseModel):
    username: str
    email: str
    full_name: str | None = None
    password: str
    disabled: bool = False

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def get_hashed_password(password: str) -> str:
   
    return pwd_context.hash(password[:72])

def verify_password(password: str, hashed_password: str) -> bool:
    return pwd_context.verify(password, hashed_password)

def get_user(store: dict, username: str) -> UserInDB | None:
    
    user_data = store.get(username)
    if not user_data:
        return None
    return UserInDB(**user_data)


def authenticate_user(store: dict, username: str, password: str):
    user = get_user(store, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc)+ timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


db1 = {
    "alice": {
        "username": "alice",
        "full_name": "Alice Doe",
        "email": "alice@example.com",
        
        "hashed_password": get_hashed_password("secret"),
        "disabled": False,
    }
}


async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")  
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username) 
    except JWTError:
        raise credentials_exception

 
    user = get_user(db1, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user : UserInDB = Depends(get_current_user)):
        if current_user.disabled:
         raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
         )
        return current_user




def normalize_keys(doc: dict) -> dict:
    return {k.replace(" ", "_"): v for k, v in doc.items()}


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Connecting to MongoDB localhost:27017 …")
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        app.state.db = db
        print(f"Connected to MongoDB database '{DB_NAME}'")
        print("Collections:", db.list_collection_names())
    except Exception as e:
        print("MongoDB connection failed:", e)
        app.state.db = None
    yield
    print("Shutting down PrepWise backend…")

app = FastAPI(title="PrepWise Backend", lifespan=lifespan)

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(db1, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/signup", response_model=User)
async def signup(user: UserSignup):
    if user.username in db1:
        raise HTTPException(status_code=400, detail="Username already registered")

    hashed_pw = get_hashed_password(user.password)
    new_user = UserInDB(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_pw,
        disabled=user.disabled,
    )

    db1[user.username] = new_user.model_dump()
    return User(**new_user.model_dump())



@app.get("/users/me/", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user


@app.get("/users/me/items")
async def read_own_items(current_user: User = Depends(get_current_active_user)):
    return [{"item_id": 1, "owner": current_user}]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze")
def analyze(
    req: AnalyzeRequest,
    current_user: User = Depends(get_current_active_user),  
):
    db = app.state.db
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available.")
  

    try:
        bmi = calculate_bmi(req.weight, req.height)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    category = bmi_category(bmi)
    agent = choose_agent(req.age, category, req.diseases, req.caste)
    strategy = build_strategy(agent, category, req.dietType, req.diseases)

    meals_col = db["Meals"]
    meals_clean_col = db["Meals_clean"]
    food_col = db["Food"]

    breakfast = get_meals(meals_col, "Breakfast", 3)
    lunch = get_meals(meals_clean_col, "Lunch", 3)
    dinner = get_meals(meals_clean_col, "Dinner", 3)

    hints = [x["hint"] for x in breakfast + lunch + dinner][:10]

    return {
        "bmi": bmi,
        "category": category,
        "agent": agent,
        "strategy": strategy,
        "meal_plan": {"breakfast": breakfast, "lunch": lunch, "dinner": dinner},
        "hints": hints,
        "user": current_user.username,
    }

# Ping
@app.get("/ping")
def ping():
    return {"status": "ok", "source": "MongoDB"}

# BMI utils
def calculate_bmi(weight: float, height: float) -> float:
    if height <= 0:
        raise ValueError("Height must be greater than 0.")
    return round(weight / ((height / 100) ** 2), 1)

def bmi_category(bmi: float) -> str:
    if bmi < 18.5:
        return "Oops! Underweight. Need to gain weight."
    elif bmi < 25:
        return "Normal"
    elif bmi < 30:
        return "Oops! Overweight. Time to get shredded."
    else:
        return "Oops! Obese. Time to get shredded."

def choose_agent(age: int, bmi_cat: str, diseases: str, caste: str) -> str:
    d = diseases.lower()
    if any(x in d for x in ["diabet", "sugar", "blood"]):
        return "Macro-Agent"
    if caste.strip():
        return "Cultural-Agent"
    if bmi_cat in ("Overweight", "Obese"):
        return "Calorie-Agent"
    return "Macro-Agent"

def build_strategy(agent: str, bmi_cat: str, dietType: str, diseases: str) -> str:
    if agent == "Calorie-Agent":
        return f"Low-calorie strategy for {bmi_cat} individuals (Diet: {dietType})"
    if agent == "Macro-Agent":
        return f"Balanced macros with disease-aware tweaks (Diet: {dietType})"
    if agent == "Cultural-Agent":
        return f"Culturally-aware meal plan respecting preferences (Diet: {dietType})"
    return "General health-focused approach."

def get_meals(collection, field_prefix: str, count: int = 3):
    docs = list(collection.find())
    random.shuffle(docs)
    result = []
    for doc in docs[:count]:
        d = normalize_keys(doc)
        name = d.get(f"{field_prefix}_Suggestion") or "Unknown"
        hint = f"{d.get(f'{field_prefix}_Calories','?')} kcal, Protein {d.get(f'{field_prefix}_Protein','?')}g"
        result.append({"name": name, "hint": hint})
    return result


if __name__ == "__main__":
    print("PrepWise API running at http://127.0.0.1:8000 …")
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

