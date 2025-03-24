const mongoose = require("mongoose");
const faker = require("faker");

// Function to generate random tours
function generateTours(count) {
    const tours = [];
    const destinations = [
        "Ha Long Bay",
        "Hanoi",
        "Ho Chi Minh City",
        "Da Nang",
        "Nha Trang",
        "Hue",
        "Phu Quoc",
        "Sapa",
        "Hoi An",
        "Mui Ne",
    ];
    const difficulties = ["easy", "medium", "hard"];
    const categories = [
        mongoose.Types.ObjectId(), // Use real category ObjectIds from your DB
        mongoose.Types.ObjectId(),
        mongoose.Types.ObjectId(),
    ];
    const reviewIds = [
        mongoose.Types.ObjectId(), // Use real review ObjectIds from your DB
        mongoose.Types.ObjectId(),
    ];
    const adminIds = [mongoose.Types.ObjectId()]; // Use real admin ObjectIds from your DB

    for (let i = 0; i < count; i++) {
        const startDate = faker.date.future();
        const endDate = faker.date.future();
        const duration = faker.random.number({ min: 1, max: 15 });

        tours.push({
            name: faker.company.catchPhrase(),
            description: faker.lorem.sentences(3),
            price: faker.commerce.price(50, 1000),
            start_date: startDate,
            end_date: endDate,
            created_by: adminIds[Math.floor(Math.random() * adminIds.length)],
            categories: categories,
            reviews: reviewIds,
            average_review_star: faker.random.number({ min: 1, max: 5 }),
            created_at: faker.date.past(),
            destination: destinations[Math.floor(Math.random() * destinations.length)],
            duration: duration,
            max_group_size: faker.random.number({ min: 5, max: 30 }),
            difficulty: difficulties[Math.floor(Math.random() * difficulties.length)],
            image_cover: faker.image.imageUrl(),
            thumnail: faker.image.imageUrl(),
            images: [faker.image.imageUrl(), faker.image.imageUrl()],
        });
    }
    return tours;
}

// Example usage
const tours = generateTours(100);

// To insert into MongoDB, assuming you have the model loaded
const Tour = require("./models/tour"); // Import your Tour model

Tour.insertMany(tours)
    .then(() => console.log("Tours inserted"))
    .catch((error) => console.error("Error inserting tours:", error));
