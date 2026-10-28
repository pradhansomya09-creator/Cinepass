import { PrismaClient, UserRole, SeatCategory, SeatStatus, BookingStatus, PaymentStatus, DiscountType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seeding...');

  // 1. Clean existing records in reverse dependency order
  await prisma.auditLog.deleteMany();
  await prisma.review.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.bookingSeat.deleteMany();
  await prisma.couponRedemption.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.seatHoldItem.deleteMany();
  await prisma.seatHold.deleteMany();
  await prisma.showSeat.deleteMany();
  await prisma.show.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.screen.deleteMany();
  await prisma.cinema.deleteMany();
  await prisma.city.deleteMany();
  await prisma.movieGenre.deleteMany();
  await prisma.genre.deleteMany();
  await prisma.movie.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing records.');

  // 2. Seed Users
  const adminPasswordHash = await bcrypt.hash('AdminPassword@123', 10);
  const userPasswordHash = await bcrypt.hash('UserPassword@123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'System Administrator',
      email: 'admin@cinepass.com',
      phone: '9876543210',
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      isEmailVerified: true,
    },
  });

  const user1 = await prisma.user.create({
    data: {
      name: 'Ashish Kumar',
      email: 'ashish@example.com',
      phone: '9812345678',
      passwordHash: userPasswordHash,
      role: UserRole.USER,
      isEmailVerified: true,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Priya Sharma',
      email: 'priya@example.com',
      phone: '9823456789',
      passwordHash: userPasswordHash,
      role: UserRole.USER,
      isEmailVerified: true,
    },
  });

  console.log('👤 Users seeded: Admin (admin@cinepass.com), Users (ashish@example.com, priya@example.com)');

  // 3. Seed Genres
  const genreNames = ['Action', 'Sci-Fi', 'Thriller', 'Drama', 'Adventure', 'Comedy', 'Animation', 'Crime'];
  const genres: Record<string, string> = {};
  for (const name of genreNames) {
    const g = await prisma.genre.create({ data: { name } });
    genres[name] = g.id;
  }

  // 4. Seed Cities & Cinemas & Screens & Seats
  const citiesData = [
    {
      name: 'Mumbai',
      state: 'Maharashtra',
      cinemas: [
        {
          name: 'PVR Superplex Inorbit Mall, Malad',
          address: 'Inorbit Mall, Link Road, Malad West, Mumbai, MH 400064',
          facilities: ['IMAX 4K with Laser', 'Dolby Atmos', 'Recliner Loungers', 'Gourmet Food & Beverages', 'Wheelchair Access'],
          screens: [
            { name: 'Screen 1 (IMAX Laser)', soundType: 'Dolby Atmos 12.1', screenType: 'IMAX Laser 4K' },
            { name: 'Screen 2 (Dolby Cinema)', soundType: 'Dolby Atmos 7.1', screenType: 'RealD 3D 4K' },
          ],
        },
        {
          name: 'INOX Megaplex Palladium Mall',
          address: 'High Street Phoenix, Senapati Bapat Marg, Lower Parel, Mumbai, MH 400013',
          facilities: ['INSIGNIA Luxury Lounge', 'Laser Projection', 'Valet Parking', 'Wheelchair Access'],
          screens: [
            { name: 'Screen 1 (Insignia Gold)', soundType: 'Dolby Atmos 7.1', screenType: 'Laser 4K' },
          ],
        },
      ],
    },
    {
      name: 'Bengaluru',
      state: 'Karnataka',
      cinemas: [
        {
          name: 'PVR Forum South Bengaluru, Kanakapura',
          address: 'Forum Mall, Konanakunte Cross, Kanakapura Rd, Bengaluru, KA 560062',
          facilities: ['P[XL] Giant Screen', 'Dolby Atmos', 'Cafe & Bar', 'Parking'],
          screens: [
            { name: 'Screen 1 (P[XL] Atmos)', soundType: 'Dolby Atmos 7.1', screenType: 'P[XL] 4K Dual Laser' },
            { name: 'Screen 2 (Classic)', soundType: 'Dolby Surround 7.1', screenType: 'Barco 4K' },
          ],
        },
      ],
    },
    {
      name: 'Delhi-NCR',
      state: 'Delhi',
      cinemas: [
        {
          name: 'PVR Directors Cut, Ambience Mall Vasant Kunj',
          address: 'Ambience Mall, Nelson Mandela Marg, Vasant Kunj, New Delhi, DL 110070',
          facilities: ['Director’s Cut Recliners', 'Dedicated Butler Service', 'Wine & Dine', 'Dolby 7.1'],
          screens: [
            { name: 'Auditorium 1 (Platinum)', soundType: 'Dolby Atmos 7.1', screenType: 'Christie 4K' },
          ],
        },
      ],
    },
  ];

  const screensList: { id: string; name: string; cinemaName: string; cityName: string }[] = [];
  const screenSeatsMap: Record<string, { id: string; rowLabel: string; seatNumber: number; category: SeatCategory }[]> = {};

  for (const cData of citiesData) {
    const city = await prisma.city.create({
      data: { name: cData.name, state: cData.state },
    });

    for (const cinData of cData.cinemas) {
      const cinema = await prisma.cinema.create({
        data: {
          name: cinData.name,
          cityId: city.id,
          address: cinData.address,
          facilities: cinData.facilities,
        },
      });

      for (const scrData of cinData.screens) {
        const screen = await prisma.screen.create({
          data: {
            name: scrData.name,
            cinemaId: cinema.id,
            soundType: scrData.soundType,
            screenType: scrData.screenType,
          },
        });

        screensList.push({ id: screen.id, name: screen.name, cinemaName: cinema.name, cityName: city.name });

        // Generate seats:
        // Rows A, B, C: Regular (10 seats each)
        // Rows D, E, F: Premium (10 seats each)
        // Row G: Recliner (8 luxury seats)
        const seatsToCreate: { screenId: string; rowLabel: string; seatNumber: number; category: SeatCategory }[] = [];
        
        ['A', 'B', 'C'].forEach((row) => {
          for (let num = 1; num <= 10; num++) {
            seatsToCreate.push({ screenId: screen.id, rowLabel: row, seatNumber: num, category: SeatCategory.REGULAR });
          }
        });

        ['D', 'E', 'F'].forEach((row) => {
          for (let num = 1; num <= 10; num++) {
            seatsToCreate.push({ screenId: screen.id, rowLabel: row, seatNumber: num, category: SeatCategory.PREMIUM });
          }
        });

        for (let num = 1; num <= 8; num++) {
          seatsToCreate.push({ screenId: screen.id, rowLabel: 'G', seatNumber: num, category: SeatCategory.RECLINER });
        }

        const createdSeats = [];
        for (const s of seatsToCreate) {
          const seat = await prisma.seat.create({ data: s });
          createdSeats.push(seat);
        }
        screenSeatsMap[screen.id] = createdSeats;
      }
    }
  }

  console.log(`🏙️ Cities, Cinemas, Screens, and ${Object.values(screenSeatsMap).reduce((a, b) => a + b.length, 0)} Seats created.`);

  // 5. Seed Movies
  const moviesData = [
    {
      title: 'Dune: Part Two',
      description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, he endeavors to prevent a terrible future only he can foresee.',
      durationMinutes: 166,
      releaseDate: new Date('2024-03-01'),
      language: 'English',
      rating: 8.8,
      ageClassification: 'UA 16+',
      director: 'Denis Villeneuve',
      cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Javier Bardem', 'Austin Butler'],
      posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop',
      bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600&auto=format&fit=crop',
      trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
      genres: ['Action', 'Adventure', 'Sci-Fi'],
      isFeatured: true,
      isComingSoon: false,
    },
    {
      title: 'Oppenheimer',
      description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II, exploring the moral paradoxes and political aftermath of the Manhattan Project.',
      durationMinutes: 180,
      releaseDate: new Date('2023-07-21'),
      language: 'English',
      rating: 8.9,
      ageClassification: 'A',
      director: 'Christopher Nolan',
      cast: ['Cillian Murphy', 'Emily Blunt', 'Matt Damon', 'Robert Downey Jr.', 'Florence Pugh'],
      posterUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=800&auto=format&fit=crop',
      bannerUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=1600&auto=format&fit=crop',
      trailerUrl: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
      genres: ['Drama', 'Thriller'],
      isFeatured: true,
      isComingSoon: false,
    },
    {
      title: 'Spider-Man: Across the Spider-Verse',
      description: 'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence. When the heroes clash on how to handle a new threat, Miles must redefine what it means to be a hero.',
      durationMinutes: 140,
      releaseDate: new Date('2023-06-02'),
      language: 'English',
      rating: 8.7,
      ageClassification: 'U',
      director: 'Joaquim Dos Santos, Kemp Powers',
      cast: ['Shameik Moore', 'Hailee Steinfeld', 'Oscar Isaac', 'Daniel Kaluuya'],
      posterUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=800&auto=format&fit=crop',
      bannerUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=1600&auto=format&fit=crop',
      trailerUrl: 'https://www.youtube.com/watch?v=cqGjhVJWtEg',
      genres: ['Animation', 'Action', 'Sci-Fi'],
      isFeatured: false,
      isComingSoon: false,
    },
    {
      title: 'Interstellar',
      description: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.',
      durationMinutes: 169,
      releaseDate: new Date('2014-11-07'),
      language: 'English',
      rating: 8.7,
      ageClassification: 'UA',
      director: 'Christopher Nolan',
      cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain', 'Michael Caine'],
      posterUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=800&auto=format&fit=crop',
      bannerUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1600&auto=format&fit=crop',
      trailerUrl: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
      genres: ['Sci-Fi', 'Drama', 'Adventure'],
      isFeatured: true,
      isComingSoon: false,
    },
    {
      title: 'Kalki 2898 AD',
      description: 'A modern-day avatar of Vishnu, a Hindu god, who is believed to have descended to the earth to protect the world from evil forces in a dystopian futuristic city of Kasi.',
      durationMinutes: 181,
      releaseDate: new Date('2024-06-27'),
      language: 'Hindi',
      rating: 8.4,
      ageClassification: 'UA 13+',
      director: 'Nag Ashwin',
      cast: ['Prabhas', 'Amitabh Bachchan', 'Kamal Haasan', 'Deepika Padukone'],
      posterUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=800&auto=format&fit=crop',
      bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600&auto=format&fit=crop',
      trailerUrl: 'https://www.youtube.com/watch?v=kQDd1AhGIHk',
      genres: ['Action', 'Sci-Fi'],
      isFeatured: false,
      isComingSoon: false,
    },
    {
      title: 'Avatar 3: Fire and Ash',
      description: 'Jake Sully and Neytiri return with their family to face the Ash People, an aggressive volcanic clan of Na\'vi on Pandora.',
      durationMinutes: 190,
      releaseDate: new Date('2025-12-19'),
      language: 'English',
      rating: 0.0,
      ageClassification: 'UA',
      director: 'James Cameron',
      cast: ['Sam Worthington', 'Zoe Saldana', 'Sigourney Weaver', 'Stephen Lang'],
      posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',
      bannerUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1600&auto=format&fit=crop',
      trailerUrl: 'https://www.youtube.com/watch?v=d9MyW72ELq0',
      genres: ['Action', 'Adventure', 'Sci-Fi'],
      isFeatured: false,
      isComingSoon: true,
    },
  ];

  const createdMovies = [];
  for (const m of moviesData) {
    const movie = await prisma.movie.create({
      data: {
        title: m.title,
        description: m.description,
        durationMinutes: m.durationMinutes,
        releaseDate: m.releaseDate,
        language: m.language,
        rating: m.rating,
        ageClassification: m.ageClassification,
        director: m.director,
        cast: m.cast,
        posterUrl: m.posterUrl,
        bannerUrl: m.bannerUrl,
        trailerUrl: m.trailerUrl,
        isFeatured: m.isFeatured,
        isComingSoon: m.isComingSoon,
      },
    });

    for (const gName of m.genres) {
      if (genres[gName]) {
        await prisma.movieGenre.create({
          data: {
            movieId: movie.id,
            genreId: genres[gName],
          },
        });
      }
    }
    createdMovies.push(movie);
  }

  console.log(`🎬 Movies seeded: ${createdMovies.length} titles.`);

  // 6. Seed Shows (for now-playing movies across screens)
  const nowPlayingMovies = createdMovies.filter((m) => !m.isComingSoon);
  const now = new Date();

  // Create shows for Today, Tomorrow, and Next Day at slots: 10:00, 14:00, 18:00, 21:30
  const timeSlots = [
    { hour: 10, minute: 0 },
    { hour: 14, minute: 0 },
    { hour: 18, minute: 0 },
    { hour: 21, minute: 30 },
  ];

  const createdShows = [];
  for (let dayOffset = 0; dayOffset < 4; dayOffset++) {
    const showDate = new Date(now);
    showDate.setDate(showDate.getDate() + dayOffset);

    for (let sIdx = 0; sIdx < screensList.length; sIdx++) {
      const screenInfo = screensList[sIdx];
      const movie = nowPlayingMovies[sIdx % nowPlayingMovies.length];

      for (const slot of timeSlots) {
        const startTime = new Date(showDate);
        startTime.setHours(slot.hour, slot.minute, 0, 0);

        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + movie.durationMinutes + 20); // 20m interval

        const show = await prisma.show.create({
          data: {
            movieId: movie.id,
            screenId: screenInfo.id,
            startTime,
            endTime,
            priceRegular: 220.0,
            pricePremium: 350.0,
            priceRecliner: 550.0,
            isActive: true,
          },
        });

        // Initialize ShowSeat records for this show
        const seats = screenSeatsMap[screenInfo.id] || [];
        const showSeatsData = seats.map((seat) => {
          let price = 220.0;
          if (seat.category === SeatCategory.PREMIUM) price = 350.0;
          if (seat.category === SeatCategory.RECLINER) price = 550.0;

          return {
            showId: show.id,
            seatId: seat.id,
            status: SeatStatus.AVAILABLE,
            price,
          };
        });

        await prisma.showSeat.createMany({ data: showSeatsData });
        createdShows.push(show);
      }
    }
  }

  console.log(`🎟️ Shows created: ${createdShows.length} shows across screens with real-time seat inventories.`);

  // 7. Seed Coupons
  const couponsData = [
    {
      code: 'CINE20',
      description: 'Get 20% discount up to ₹150 on tickets',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 20.0,
      minBookingAmount: 300.0,
      maxDiscountAmount: 150.0,
      globalUsageLimit: 500,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2027-12-31'),
    },
    {
      code: 'FLAT100',
      description: 'Flat ₹100 instant discount on bookings above ₹500',
      discountType: DiscountType.FIXED,
      discountValue: 100.0,
      minBookingAmount: 500.0,
      maxDiscountAmount: 100.0,
      globalUsageLimit: 200,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2027-12-31'),
    },
    {
      code: 'VIP50',
      description: '50% off up to ₹250 for Recliner & Premium seats',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 50.0,
      minBookingAmount: 600.0,
      maxDiscountAmount: 250.0,
      globalUsageLimit: 100,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2027-12-31'),
    },
  ];

  for (const c of couponsData) {
    await prisma.coupon.create({ data: c });
  }

  console.log(`🏷️ Coupons seeded: CINE20, FLAT100, VIP50.`);

  // 8. Seed Sample Confirmed Booking with Ticket & Payment for demonstration
  if (createdShows.length > 0) {
    const sampleShow = createdShows[0];
    const seatsForShow = await prisma.showSeat.findMany({
      where: { showId: sampleShow.id },
      include: { seat: true },
      take: 2,
    });

    if (seatsForShow.length >= 2) {
      const seat1 = seatsForShow[0];
      const seat2 = seatsForShow[1];

      const total = Number(seat1.price) + Number(seat2.price);
      const discount = 50.0;
      const finalAmount = total - discount;

      const booking = await prisma.booking.create({
        data: {
          bookingReference: 'CP-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
          userId: user1.id,
          showId: sampleShow.id,
          totalAmount: total,
          discountAmount: discount,
          finalAmount: finalAmount,
          status: BookingStatus.CONFIRMED,
          couponCode: 'CINE20',
          seats: {
            create: [
              { seatId: seat1.seatId, price: seat1.price, category: seat1.seat.category },
              { seatId: seat2.seatId, price: seat2.price, category: seat2.seat.category },
            ],
          },
        },
        include: { seats: true },
      });

      // Mark show seats as BOOKED
      await prisma.showSeat.update({
        where: { id: seat1.id },
        data: { status: SeatStatus.BOOKED, bookingSeatId: booking.seats[0].id },
      });
      await prisma.showSeat.update({
        where: { id: seat2.id },
        data: { status: SeatStatus.BOOKED, bookingSeatId: booking.seats[1].id },
      });

      // Create Payment record
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          razorpayOrderId: 'order_mock_' + Math.random().toString(36).substring(2, 10),
          razorpayPaymentId: 'pay_mock_' + Math.random().toString(36).substring(2, 10),
          razorpaySignature: 'sig_mock_verified_signature_hash',
          amount: finalAmount,
          currency: 'INR',
          status: PaymentStatus.SUCCESS,
          method: 'UPI / NetBanking',
        },
      });

      // Create Electronic Ticket
      await prisma.ticket.create({
        data: {
          bookingId: booking.id,
          ticketNumber: 'TKT-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
          qrToken: 'CINEPASS_TOKEN_' + Math.random().toString(36).substring(2, 12).toUpperCase(),
          isRedeemed: false,
        },
      });

      console.log(`🎟️ Sample confirmed booking (${booking.bookingReference}) with ticket created for demonstration.`);
    }
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
