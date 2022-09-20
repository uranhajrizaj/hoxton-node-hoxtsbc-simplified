import { PrismaClient } from "@prisma/client";
import cors from "cors";
import express from "express";
import bcrypt from "bcryptjs";

const app = express();
app.use(cors());
app.use(express.json());
const port = 5555;

const prisma = new PrismaClient({ log: ["error", "info", "query", "warn"] });

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
      });
      res.send(newUser);
    }
  } catch (error) {
    //@ts-ignore
    res.send({ error: error.message });
  }
});

app.post("/sign-in", async (req, res) => {
  const findUser = await prisma.user.findUnique({
    where: { email: req.body.email },
  });
  if(findUser&& bcrypt.compareSync(req.body.password,findUser.password)){
    res.send(findUser)
  } else{
    res.status(400).send({error:"Email or password is incorrect"})
  }
});

app.listen(port, () => {
  console.log(`Serveri is running on: http://localhost:${port}`);
});
