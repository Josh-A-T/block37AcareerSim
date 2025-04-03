const {
    client,
    createTables,
    createUser,
    authenticate,
    findUserByToken,
    createItem,
    fetchItems,
    fetchItemById,
    createReview,
    fetchReviewsByItem,
    fetchReviewsByUser,
    updateReview,
    deleteReview,
    createComment,
    fetchCommentsByUser,
    updateComment,
    deleteComment,
  } = require("./db");
  
  const express = require("express");
  const app = express();
  app.use(require('cors')({
    origin: 'http://localhost:8000', 
    credentials: true
  }));
  app.use(express.json());
  
  // For deployment only: serve static files (if a front-end is provided)
  const path = require("path");
  app.get("/", (req, res) =>
    res.sendFile(path.join(__dirname, "../client/dist/index.html"))
  );
  app.use(
    "/assets",
    express.static(path.join(__dirname, "../client/dist/assets"))
  );
  
  // ------------------------------
  // Authentication Routes
  // ------------------------------
  
  // POST /api/auth/register: Register a new user.
  app.post("/api/auth/register", async (req, res, next) => {
    try {
        const user = await createUser(req.body);
        res.status(201).send(user);
    } catch (ex) {
        next(ex);
    }
  });
  
  // POST /api/auth/login: Authenticate a user.
  app.post("/api/auth/login", async (req, res, next) => {
    try {
        res.send(await authenticate(req.body));
    } catch (ex) {
        next(ex);
    }
  });
  
  // GET /api/auth/me: Retrieve the current user's info (token expected in headers.authorization).
  app.get("/api/auth/me", async (req, res, next) => {
    try {
        res.send(await findUserByToken(req.headers.authorization));
    } catch (ex) {
        next(ex);
    }
  });
  
  // ------------------------------
  // Items Routes
  // ------------------------------
  
  // GET /api/items: Retrieve all items.
  app.get("/api/items", async (req, res, next) => {
    try {
        res.send(await fetchItems());
    } catch (ex) {
        next(ex);
    }
  });
  
  // GET /api/items/:id: Retrieve a specific item.
  app.get("/api/items/:id", async (req, res, next) => {
    try {
        res.send(await fetchItemById(req.params.id));
    } catch (ex) {
        next(ex);
    }
  });
  
  // ------------------------------
  // Reviews Routes
  // ------------------------------
  
  // GET /api/items/:itemId/reviews: Retrieve all reviews for an item.
  app.get("/api/items/:itemId/reviews", async (req, res, next) => {
    try {
        res.send(await fetchReviewsByItem(req.params.itemId));
    } catch (ex) {
        next(ex);
    }
  });
  
  // GET /api/users/:id/reviews: Retrieve all reviews by a specific user.
  app.get("/api/users/:id/reviews", async (req, res, next) => {
    try {
        res.send(await fetchReviewsByUser(req.params.id));
    } catch (ex) {
        next(ex);
    }
  });
  
  // POST /api/items/:itemId/reviews: Create a new review for an item.
  // (For simplicity here, we assume req.body includes a valid user_id.)
  app.post("/api/items/:itemId/reviews", async (req, res, next) => {
    try {
        const { review_text, rating, user_id } = req.body;
        res.status(201).send(
            await createReview({
                user_id,
                item_id: req.params.itemId,
                review_text,
                rating,
            })
        );
    } catch (ex) {
        next(ex);
    }
  });
  
  // PUT /api/users/:userId/reviews/:reviewId: Update an existing review.
  app.put("/api/users/:userId/reviews/:reviewId", async (req, res, next) => {
    try {
        const { review_text, rating } = req.body;
        res.send(
            await updateReview({
                user_id: req.params.userId,
                review_id: req.params.reviewId,
                review_text,
                rating,
            })
        );
    } catch (ex) {
        next(ex);
    }
  });
  
  // DELETE /api/users/:userId/reviews/:reviewId: Delete a review.
  app.delete("/api/users/:userId/reviews/:reviewId", async (req, res, next) => {
    try {
        await deleteReview({
            user_id: req.params.userId,
            review_id: req.params.reviewId,
        });
        res.sendStatus(204);
    } catch (ex) {
        next(ex);
    }
  });
  
  // ------------------------------
  // Comments Routes
  // ------------------------------
  
  // POST /api/items/:itemId/reviews/:reviewId/comments: Create a new comment on a review.
  app.post(
    "/api/items/:itemId/reviews/:reviewId/comments",
    async (req, res, next) => {
        try {
            // For simplicity, assume req.body contains a valid user_id.
            res.status(201).send(
                await createComment({
                    review_id: req.params.reviewId,
                    user_id: req.body.user_id,
                    comment_text: req.body.comment_text,
                })
            );
        } catch (ex) {
            next(ex);
        }
    }
  );
  
  // GET /api/users/:id/comments: Retrieve all comments by a specific user.
  app.get("/api/users/:id/comments", async (req, res, next) => {
    try {
        res.send(await fetchCommentsByUser(req.params.id));
    } catch (ex) {
        next(ex);
    }
  });
  
  // PUT /api/users/:userId/comments/:commentId: Update a comment.
  app.put("/api/users/:userId/comments/:commentId", async (req, res, next) => {
    try {
        res.send(
            await updateComment({
                user_id: req.params.userId,
                comment_id: req.params.commentId,
                comment_text: req.body.comment_text,
            })
        );
    } catch (ex) {
        next(ex);
    }
  });
  
  // DELETE /api/users/:userId/comments/:commentId: Delete a comment.
  app.delete("/api/users/:userId/comments/:commentId", async (req, res, next) => {
    try {
        await deleteComment({
            user_id: req.params.userId,
            comment_id: req.params.commentId,
        });
        res.sendStatus(204);
    } catch (ex) {
        next(ex);
    }
  });
  
  // ------------------------------
  // Global Error Handling Middleware
  // ------------------------------
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).send({ error: err.message || err });
  });
  
  // ------------------------------
  // Server Initialization and Data Seeding
  // ------------------------------
  const init = async () => {
    console.log("Connecting to database");
    await client.connect();
    console.log("Connected to database");
    await createTables();
    console.log("Tables created");
  
    // Seed initial data.
    const [user1, user2, item1, item2] = await Promise.all([
        createUser({
            username: "alice",
            password: "alice_pw",
            email: "alice@example.com",
        }),
        createUser({
            username: "bob",
            password: "bob_pw",
            email: "bob@example.com",
        }),
        createItem({
            name: "Item One",
            description: "Description for item one",
        }),
        createItem({
            name: "Item Two",
            description: "Description for item two",
        }),
    ]);
  
    console.log(await fetchItems());
    console.log("Data seeded");
  
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Listening on port ${port}`));
  };
  
  init();