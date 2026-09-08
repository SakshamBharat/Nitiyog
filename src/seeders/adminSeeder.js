const {
  User
} = require('../models');


const seedAdmin = async () => {

  try {

    const adminEmail =
      'admin@nitiyog.gov.in';


    const existingAdmin =
      await User.findOne({
        where: {
          email: adminEmail
        }
      });


    if (!existingAdmin) {

      await User.create({

        name:
          'System Administrator',

        email:
          adminEmail,

        password:
          'AdminPassword123!',

        role:
          'ADMIN',

        isVerified:
          true
      });


      console.log(
        'Default Admin Account Created: admin@nitiyog.gov.in'
      );

    } else {

      // Make sure existing admin remains admin
      if (existingAdmin.role !== 'ADMIN') {

        existingAdmin.role = 'ADMIN';

        existingAdmin.isVerified = true;

        await existingAdmin.save();
      }

      console.log(
        'Admin Account already exists.'
      );
    }


  } catch (error) {

    console.error(
      'Error Seeding Admin:',
      error
    );
  }
};


module.exports = seedAdmin;
