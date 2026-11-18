const mongoose = require('mongoose')

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 150,
    },
    description: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ['planned', 'in_progress', 'completed'],
      default: 'planned',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_document, result) {
        result.id = result._id.toString()
        delete result._id
        delete result.__v
        return result
      },
    },
  },
)

module.exports = mongoose.model('Project', projectSchema)
