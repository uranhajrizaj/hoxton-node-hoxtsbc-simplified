import { PrismaClient } from "@prisma/client";
import cors from "cors";
import express from "express";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'
dotenv.config()

const app = express();
app.use(cors());
app.options('*', cors())
app.use(express.json());
const port = 5555;

const prisma = new PrismaClient({ log: ["error", "info", "query", "warn"] });

const SECRET= process.env.SECRET!


function getToken (id: number) {
  return jwt.sign({ id: id }, SECRET, {
    expiresIn: '5 minutes'
  })
}

async function getCurrentUser (token: string) {
  const decodedData = jwt.verify(token, SECRET)
  const user = await prisma.user.findUnique({
    // @ts-ignore
    where: { id: decodedData.id },
    include: { transactions: true }
  })
  return user
}
app.post("/sign-up", async (req, res) => {
  try {
    const findUser = await prisma.user.findUnique({
      where: { email: req.body.email },
    });
    if (findUser) {
      res.status(400).send({ error: "This account already exists" });
    } else {
      const newUser = await prisma.user.create({
        data: {
          name: req.body.name,
          surname: req.body.surname,
          email: req.body.email,
          password: bcrypt.hashSync(req.body.password),
        },
        include:{transactions:true}
      });
      res.send({user:newUser, token:getToken(newUser.id)});
    }
  } catch (error) {
    //@ts-ignore
    res.send({ error: error.message });
  }
});

app.post("/sign-in", async (req, res) => {
  const findUser = await prisma.user.findUnique({
    where: { email: req.body.email },
    include:{transactions:true}
  });
  if(findUser&& bcrypt.compareSync(req.body.password,findUser.password)){
    res.send({user:findUser, token:getToken(findUser.id)})
  } else{
    res.status(400).send({error:"Email or password is incorrect"})
  }
});

app.get('/validate', async (req, res) => {
  try {
    if (req.headers.authorization) {
      const user = await getCurrentUser(req.headers.authorization)
      // @ts-ignore
      res.send({ user, token: getToken(user.id) })
    }
  } catch (error) {
    // @ts-ignore
    res.status(400).send({ error: error.message })
  }
})

app.get('/transactions', async (req, res) => {
  try {
    // @ts-ignore
    const user = await getCurrentUser(req.headers.authorization)
    // @ts-ignore
    res.send(user.transactions)
  } catch (error) {
    // @ts-ignore
    res.status(400).send({ error: error.message })
  }
})

app.listen(port, () => {
  console.log(`Serveri is running on: http://localhost:${port}`);
});
