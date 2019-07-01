// const uuid = require("uuid/v4");
const express = require("express");
const router = express.Router();
// const { books } = require("../data/db.json");
const { Book, Author } = require("../models");
const { sequelize } = require("../models/index");

const filterBooksBy = (property, value) => {
  return books.filter(b => b[property] === value);
};

const verifyToken = (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) {
    res.sendStatus(403);
  } else {
    if (authorization === "Bearer my-awesome-token") {
      next();
    } else {
      res.sendStatus(403);
    }
  }
};

router
  .route("/")
  .get(async (req, res) => {
    const { author, title } = req.query;

    if (title) {
      const foundBook = await Book.findOne({
        where: { title: title },
        include: [Author]
      });
      res.json(foundBook);
    } else if (author) {
      const foundBook = await Book.findAll({
        include: [{ model: Author, where: { name: author } }]
      });
      res.json(foundBook);
    } else {
      const foundBook = await Book.findAll({
        include: [Author]
      });
      res.json(foundBook);
    }
  })
  // .post(verifyToken, async (req, res) => {
  //   const { title, author } = req.body;

  //   const newBook = await Book.create(
  //     {
  //       title: title,
  //       author: author
  //     },
  //     { include: [Author] }
  //   );
  //   res.status(201).json(newBook);
  // });

  .post(verifyToken, async (req, res) => {
    try {
      await sequelize.transaction(async t => {
        const [foundAuthor] = await Author.findOrCreate({
          where: { name: req.body.author },
          transaction: t
        });

        const newBook = await Book.create(
          { title: req.body.title },
          { transaction: t }
        );

        await newBook.setAuthor(foundAuthor, { transaction: t });

        const newBookWithAuthor = await Book.findOne({
          where: { id: newBook.id },
          include: [Author],
          transaction: t
        });

        res.status(201).json(newBookWithAuthor);
      }); // This is the end of sequelize transaction.
    } catch (ex) {
      res.status(400).json({
        err: `An unexpected error has occured ${ex.message}.`
      });
    }
  });

// .post(verifyToken, async (req, res) => {
//   const { title, name } = req.body;
//   try {
//     //find if author exist if not create
//     const [foundAuthor] = await Author.findOrCreate({
//       where: { name: name }
//     });
//     //create a book w/o author
//     const newBook = await Book.create({ title: title });
//     await newBook.setAuthor(foundAuthor);
//     //query again
//     const newBookWithAuthor = await Book.findOne({
//       where: { id: newBook.id },
//       include: [Author]
//     });
//     res.status(201).json(newBookWithAuthor);
//   } catch (ex) {
//     res.status(400).json({
//       err: `Author with name = [${req.body.author}] doesn\'t exist.`
//     });
//   }
// });

router
  .route("/:id")
  .put(async (req, res) => {
    const foundBook = await Book.findOne({
      where: { id: req.params.id },
      include: [Author]
    });
    if (foundBook) {
      const updatedBook = await foundBook.update({ title: req.body.title });
      res.status(202).json(updatedBook);
    } else {
      res.sendStatus(400);
    }
  })
  .delete(async (req, res) => {
    const foundBook = await Book.findOne({
      where: { id: req.params.id },
      include: [Author]
    });
    if (foundBook) {
      const destroyedBook = foundBook;
      await foundBook.destroy();
      res.status(202).json(destroyedBook);
    } else {
      res.sendStatus(400);
    }
  });

module.exports = router;
