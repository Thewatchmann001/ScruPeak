use anchor_lang::prelude::*;

declare_id!("LandBiznes111111111111111111111111111111111");

#[program]
pub mod land_registry {
    use super::*;

    /// Initialize the registry
    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    /// Register a new land parcel
    pub fn register_land(
        ctx: Context<RegisterLand>, 
        land_id: String, 
        location_hash: String,
        ulid: String
    ) -> Result<()> {
        let land_account = &mut ctx.accounts.land_account;
        
        // Metadata
        land_account.owner = ctx.accounts.owner.key();
        land_account.land_id = land_id;
        land_account.location_hash = location_hash;
        land_account.ulid = ulid;
        land_account.is_active = true;
        land_account.created_at = Clock::get()?.unix_timestamp;
        
        msg!("Land Registered: {} by {}", land_account.land_id, land_account.owner);
        Ok(())
    }

    /// Transfer ownership of land
    pub fn transfer_ownership(ctx: Context<TransferOwnership>, new_owner: Pubkey) -> Result<()> {
        let land_account = &mut ctx.accounts.land_account;
        
        // Verification: Ensure the signer is the current owner
        require!(land_account.owner == ctx.accounts.current_owner.key(), LandError::Unauthorized);
        
        // Transfer
        let previous_owner = land_account.owner;
        land_account.owner = new_owner;
        land_account.updated_at = Clock::get()?.unix_timestamp;
        
        msg!("Land Transferred: {} from {} to {}", land_account.land_id, previous_owner, new_owner);
        Ok(())
    }
}

// Validation Contexts

#[derive(Accounts)]
pub struct Initialize {}

#[derive(Accounts)]
#[instruction(land_id: String)]
pub struct RegisterLand<'info> {
    #[account(
        init, 
        payer = owner, 
        space = 8 + 32 + 50 + 64 + 30 + 1 + 8 + 8, // Discriminator + Pubkey + Strings + bool + timestamps
        seeds = [b"land", land_id.as_bytes()], 
        bump
    )]
    pub land_account: Account<'info, LandAccount>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TransferOwnership<'info> {
    #[account(mut)]
    pub land_account: Account<'info, LandAccount>,
    pub current_owner: Signer<'info>,
}

// Data Structures

#[account]
pub struct LandAccount {
    pub owner: Pubkey,          // 32 bytes
    pub land_id: String,        // Max 50 chars (UUID/SmartID)
    pub location_hash: String,  // Max 64 chars (GeoHash/H3)
    pub ulid: String,           // Max 30 chars
    pub is_active: bool,        // 1 byte
    pub created_at: i64,        // 8 bytes
    pub updated_at: i64,        // 8 bytes
}

// Errors

#[error_code]
pub enum LandError {
    #[msg("You are not the owner of this land.")]
    Unauthorized,
}
