const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://localhost:27017/onlinemandi', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const Category = require('./src/models/Category').default;
  
  // Find a category to test
  const cat = await Category.findOne({});
  if (!cat) {
    console.log("No category found");
    return;
  }
  
  console.log("Before:", cat.customFields);
  
  // Try to clear custom fields
  await Category.updateOne({ _id: cat._id }, { $set: { customFields: [] } });
  
  const updatedCat = await Category.findById(cat._id);
  console.log("After:", updatedCat.customFields);
  
  mongoose.disconnect();
}

run().catch(console.error);
