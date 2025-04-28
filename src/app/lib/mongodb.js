import { MongoClient } from "mongodb";

const uri = "mongodb+srv://menganipavan143:pavan@assignment.jkw3z.mongodb.net/?retryWrites=true&w=majority&appName=Assignment";


const dbName = "assignment";

const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
};

const client = new MongoClient(uri, options);

async function connectToDatabase() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
        const db = client.db(dbName);
        return db;
    } catch (error) {
        console.error("Failed to connect to MongoDB", error);
        process.exit(1);
    }
}

export default connectToDatabase;