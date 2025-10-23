// Create Admin User for Testing
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  const baseUrl = 'https://expensetracker-production-eb9c.up.railway.app';
  
  try {
    console.log('🔧 CREATING ADMIN USER\n');
    console.log('=' .repeat(50));

    // Step 1: Login as existing admin user
    console.log('1️⃣ LOGIN AS EXISTING ADMIN USER');
    console.log('─'.repeat(30));
    
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@expensetracker.com',
        password: 'admin123456'
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      const adminToken = loginData.data?.accessToken;
      console.log('✅ Admin login successful!');
      console.log('👤 Admin:', loginData.data.user.name);
      console.log('🔑 Token extracted:', adminToken ? 'Yes' : 'No');
      
      // Step 2: Test admin access to support tickets
      console.log('\n2️⃣ TEST ADMIN ACCESS TO SUPPORT TICKETS');
      console.log('─'.repeat(30));
      
      const adminTicketsResponse = await fetch(`${baseUrl}/api/admin/support-tickets`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        }
      });

      console.log('Admin tickets status:', adminTicketsResponse.status);
      if (adminTicketsResponse.ok) {
        const adminTicketsData = await adminTicketsResponse.json();
        console.log('✅ Admin access successful!');
        console.log('📋 Admin can see tickets:', adminTicketsData.data?.length || 0);
        if (adminTicketsData.data && adminTicketsData.data.length > 0) {
          console.log('📄 Sample ticket:', {
            id: adminTicketsData.data[0].id,
            ticket_number: adminTicketsData.data[0].ticket_number,
            subject: adminTicketsData.data[0].subject,
            status: adminTicketsData.data[0].status,
            user_name: adminTicketsData.data[0].user_name,
            user_email: adminTicketsData.data[0].user_email
          });
        }
      } else {
        const errorText = await adminTicketsResponse.text();
        console.log('❌ Admin access failed');
        console.log('Error:', errorText);
      }

      // Step 3: Test admin access to specific ticket
      console.log('\n3️⃣ TEST ADMIN ACCESS TO SPECIFIC TICKET');
      console.log('─'.repeat(30));
      
      // Get a ticket ID from regular user's tickets
      const userLoginResponse = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'tarun2022@gmail.com',
          password: 'Tarunteja1422@'
        })
      });

        if (userLoginResponse.ok) {
          const userLoginData = await userLoginResponse.json();
          const userToken = userLoginData.data?.accessToken;
          
          const userTicketsResponse = await fetch(`${baseUrl}/api/support-tickets/my-tickets`, {
            headers: {
              'Authorization': `Bearer ${userToken}`,
              'Content-Type': 'application/json',
            }
          });

          if (userTicketsResponse.ok) {
            const userTicketsData = await userTicketsResponse.json();
            if (userTicketsData.data && userTicketsData.data.length > 0) {
              const ticketId = userTicketsData.data[0].id;
              console.log('Testing with ticket ID:', ticketId);
              
              // Try admin access to specific ticket
              const adminTicketDetailsResponse = await fetch(`${baseUrl}/api/admin/support-tickets/${ticketId}`, {
                headers: {
                  'Authorization': `Bearer ${adminToken}`,
                  'Content-Type': 'application/json',
                }
              });

              console.log('Admin ticket details status:', adminTicketDetailsResponse.status);
              if (adminTicketDetailsResponse.ok) {
                const adminTicketDetailsData = await adminTicketDetailsResponse.json();
                console.log('✅ Admin can access ticket details!');
                console.log('📋 Ticket Details:');
                console.log('   - ID:', adminTicketDetailsData.data.id);
                console.log('   - Ticket Number:', adminTicketDetailsData.data.ticket_number);
                console.log('   - Subject:', adminTicketDetailsData.data.subject);
                console.log('   - Status:', adminTicketDetailsData.data.status);
                console.log('   - User Name:', adminTicketDetailsData.data.user_name);
                console.log('   - User Email:', adminTicketDetailsData.data.user_email);
                console.log('   - Messages Count:', adminTicketDetailsData.data.messages?.length || 0);
              } else {
                const errorText = await adminTicketDetailsResponse.text();
                console.log('❌ Admin ticket details access failed');
                console.log('Error:', errorText);
              }
            } else {
              console.log('⚠️ No tickets found to test with');
            }
          }
        }

        // Step 5: Test admin reply functionality
        console.log('\n5️⃣ TEST ADMIN REPLY FUNCTIONALITY');
        console.log('─'.repeat(30));
        
        if (userLoginResponse.ok) {
          const userLoginData = await userLoginResponse.json();
          const userToken = userLoginData.data?.accessToken;
          
          const userTicketsResponse = await fetch(`${baseUrl}/api/support-tickets/my-tickets`, {
            headers: {
              'Authorization': `Bearer ${userToken}`,
              'Content-Type': 'application/json',
            }
          });

          if (userTicketsResponse.ok) {
            const userTicketsData = await userTicketsResponse.json();
            if (userTicketsData.data && userTicketsData.data.length > 0) {
              const ticketId = userTicketsData.data[0].id;
              
              // Try to add admin reply
              const adminReplyResponse = await fetch(`${baseUrl}/api/admin/support-tickets/${ticketId}/reply`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${adminToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  message: 'This is an admin reply to test the admin functionality. The admin panel is working correctly!'
                })
              });

              console.log('Admin reply status:', adminReplyResponse.status);
              if (adminReplyResponse.ok) {
                const adminReplyData = await adminReplyResponse.json();
                console.log('✅ Admin reply successful!');
                console.log('📝 Reply Details:');
                console.log('   - Message ID:', adminReplyData.data.id);
                console.log('   - Message:', adminReplyData.data.message);
                console.log('   - Created:', adminReplyData.data.created_at);
              } else {
                const errorText = await adminReplyResponse.text();
                console.log('❌ Admin reply failed');
                console.log('Error:', errorText);
              }
            }
          }
        }

      } else {
        const errorText = await loginResponse.text();
        console.log('❌ Admin login failed');
        console.log('Error:', errorText);
      }
      
    } else {
      const errorText = await registerResponse.text();
      console.log('❌ Admin registration failed');
      console.log('Error:', errorText);
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 ADMIN USER CREATION AND TEST COMPLETED!');

  } catch (error) {
    console.error('\n❌ ADMIN TEST FAILED:', error.message);
    console.log('🔍 Please check the error details above.');
  }
}

createAdminUser();