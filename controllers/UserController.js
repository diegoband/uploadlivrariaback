const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//helpers
const createUserToken = require("../helpers/create-user-token");
const getToken = require("../helpers/get-token");
const getUserByToken = require("../helpers/get-user-by-token");

module.exports = class UserController {
  static async register(req, res) {
    const { name, email, phone, password, confirmpassword, accesscontrol } =
      req.body;
    // validations
    if (!name) {
      res.status(422).json({ message: "O nome e obrigatorio" });
      return;
    }
    if (!email) {
      res.status(422).json({ message: "O email e obrigatorio" });
      return;
    }
    if (!phone) {
      res.status(422).json({ message: "O telefone é obrigatorio" });
      return;
    }
    if (!confirmpassword) {
      res.status(422).json({ message: "O confirmaçao de senha é obrigatorio" });
      return;
    }
    if (password !== confirmpassword) {
      res.status(422).json({
        message: "A senha e a confirmaçao de senha precisa ser iguais",
      });
      return;
    }
    //check if user exists
    const userExists = await User.findOne({ email: email });
    if (userExists) {
      res.status(422).json({ message: "Por favor, utilize outro e-mail" });
      return;
    }

    // create password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // create user

    const user = new User({
      name: name,
      email: email,
      phone: phone,
      password: passwordHash,
      accesscontrol: false,
    });

    try {
      const newUser = await user.save();
      await createUserToken(newUser, req, res);
    } catch (err) {
      res.status(500).json({ message: err });
    }
  }
  static async login(req, res) {
    const { email, password } = req.body;

    if (!email) {
      res.status(422).json({ message: "O email é obrigatorio" });
      return;
    }
    if (!password) {
      res.status(422).json({ message: "A senha é obrigatorio" });
      return;
    }

    //check if user exists
    const user = await User.findOne({ email: email });
    if (!user) {
      res.status(422).json({
        message: "Não ha usuario cadastrado com este e-mail",
      });
      return;
    }

    // check if password match with db password

    const checkPassword = await bcrypt.compare(password, user.password);

    if (!checkPassword) {
      res.status(422).json({
        message: "Senha inválida",
      });
      return;
    }

    await createUserToken(user, req, res);
  }

  static async checkUser(req, res) {
    let currentUser;

    if (req.headers.authorization) {
      const token = getToken(req);
      const decoded = jwt.verify(token, "nossosecret");
      currentUser = await User.findById(decoded.id);
      currentUser.password = undefined;
    } else {
      currentUser = null;
    }
    res.status(200).send(currentUser);
  }

  static async getUserById(req, res) {
    const id = req.params.id;

    const user = await User.findById(id).select("-password");
    if (!user) {
      res.status(422).json({
        message: "Usuario nao encontrado!",
      });
      return;
    }
    res.status(200).json({ user });
  }

  static async editUser(req, res) {
    const id = req.params.id;
    // check if user exists
    const token = getToken(req);
    const user = await getUserByToken(token);
    const { name, email, phone, password, confirmpassword } = req.body;

    if (req.file) {
      user.image = req.file.filename;
    }

    // validation

    if (!name) {
      res.status(422).json({ message: "O nome e obrigatorio" });
      return;
    }

    user.name = name;

    if (!email) {
      res.status(422).json({ message: "O email e obrigatorio" });
      return;
    }

    // check if email has already taken
    const userExists = await User.findOne({ email: email });

    if (user.email !== email && userExists) {
      res.status(422).json({
        message: "Por favor utilize outro email",
      });
      return;
    }

    user.email = email;

    if (!phone) {
      res.status(422).json({ message: "O telefone é obrigatorio" });
      return;
    }

    user.phone = phone;

    if (password != confirmpassword) {
      res.status(422).json({
        message: "As senha nao conferem!",
      });
      return;
    } else if (password === confirmpassword && password != null) {
      // create password
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(password, salt);

      user.password = passwordHash;
    }
    try {
      // return user uptdade data
      await User.findOneAndUpdate(
        { _id: user.id },
        { $set: user },
        { new: true }
      );
      res.status(200).json({
        message: "Usuario atualizado com sucesso!",
      });
    } catch (err) {
      res.status(500).json({ message: err });
      return;
    }
  }
};
