import { Repository, getRepository, DeleteResult, Connection, createConnection, getConnection} from 'typeorm';

import { ArticleEntity } from "../../src/article/article.entity"
import { Comment } from "../../src/article/comment.entity"
import { UserEntity } from "../../src/user/user.entity"
import { CreateUserDto } from "../../src/user/dto/create-user.dto"


async function createUser(connection: Connection): Promise<number> {

  const seedUser: CreateUserDto = {
    email: 'andy@example.com',
    password: 'coolpassword',
    username: 'andy'
  }
  // const newUser = await userService.create(seedUser)
  const repository = connection.getRepository(UserEntity)
  const newUser = await repository.save(seedUser)
  console.log(newUser.id);
  
  return newUser.id
}

async function createArticle(connection: Connection, userId) {

  const articleRepo = connection.getRepository(ArticleEntity)

  // attempt at firing in article and updating the db immediately rather than keeping in memory
  connection.transaction(async transactionalEntityManager => {
    const newArticle = articleRepo.insert({
      body: 'my seed data',
      description: 'my cool description',
      tagList: ['seed', 'cool'],
      title: 'Seed Article',
      slug: '/api/articles/1'
    })
  });

}

async function createNewComment(connection: Connection, articleId) {
  const commentRepo = connection.getRepository(Comment)
  const articleRepo = connection.getRepository(ArticleEntity)

  let article = await articleRepo.findOne({ id: articleId });
  
  const comment = new Comment();
  comment.body = 'hello world';

  article.comments.push(comment);

  await commentRepo.save(comment);
  article = await articleRepo.save(article);

}

async function createSeeds() {
  const connection = await createConnection({
    type: "postgres",
    host: "127.0.0.1",
    port: 5432,
    username: "postgres",
    password: "mysecretpassword",
    database: "nestjsrealworld",
    entities: [
      "../../src/**/**.entity.ts" // <============= check if this is correct and our entities are on this path
  ],
  });

  // create a used to publish seed articles with
  const getSeedUser = await createUser(connection)

  // create a pile of articles
  let i = 5000;
  while (--i) {
    createArticle(connection, getSeedUser)
  }

  // adds a new comment onto the 1st article
  await createNewComment(connection, 1)
}

createSeeds()
